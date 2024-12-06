from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import mysql.connector
import json
import re
import colorsys
from utils.database_helpers import get_user_id_by_username, get_db_connection

app = Flask(__name__)
CORS(app)

# Route to fetch stamps based on set_id
@app.route('/api/stamps/by_set_id/<int:set_id>', methods=['GET'])
def get_stamps_by_set_id(set_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = f"""
        SELECT * FROM stamps
        WHERE set_id = {set_id}
    """
    cursor.execute(query)
    stamps = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(stamps)

# get stamps by username
@app.route('/api/stamps/by_username/<string:username>', methods=['GET'])
def get_stamps_by_username(username):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    user_id = get_user_id_by_username(username, cursor)
    query = f"""
        SELECT stamps.*, sets.*, user_stamps.* FROM stamps
        JOIN user_stamps ON stamps.stamp_id = user_stamps.stamp_id
        JOIN sets ON stamps.set_id = sets.set_id
        WHERE user_stamps.user_id = {user_id}
        AND themes IS NOT NULL
    """
    cursor.execute(query)
    stamps = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(stamps)

# serve images
@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('../crawling/images_all_2', filename)

# get all unique countries
@app.route('/api/countries', methods=['GET'])
def get_countries():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT DISTINCT country 
        FROM sets 
        WHERE country IS NOT NULL 
        ORDER BY country
    """
    cursor.execute(query)
    countries = [row['country'] for row in cursor.fetchall()]
    cursor.close()
    connection.close()
    return jsonify(countries)

# get all unique themes
@app.route('/api/themes', methods=['GET'])
def get_themes():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT DISTINCT themes 
        FROM stamps 
        WHERE themes IS NOT NULL 
        AND themes != '[]'
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    connection.close()

    # Parse themes and create a set of unique themes
    all_themes = set()
    for row in rows:
        try:
            # Convert string representation of list to actual list
            themes_list = eval(row['themes'])
            for theme in themes_list:
                # Split theme by '/' and add each level
                theme_parts = theme.split('/')
                current_path = ''
                for part in theme_parts:
                    if current_path:
                        current_path += '/'
                    current_path += part
                    all_themes.add(current_path)
        except:
            continue

    # Convert set to sorted list
    themes = sorted(list(all_themes))
    return jsonify(themes)

# search endpoint to handle all search parameters
@app.route('/api/stamps/search', methods=['POST'])
def search_stamps():
    try:
        search_params = request.get_json()
        
        # Build the base query
        query = """
            SELECT s.*, st.country, st.year, st.name as set_name
            FROM stamps s
            JOIN sets st ON s.set_id = st.set_id
            WHERE 1=1
        """
        params = []

        # Add search conditions
        if search_params.get('country'):
            query += " AND st.country LIKE %s"
            params.append(f"%{search_params['country']}%")
        
        if search_params.get('year_from'):
            query += " AND st.year >= %s"
            params.append(int(search_params['year_from']))
            
        if search_params.get('year_to'):
            query += " AND st.year <= %s"
            params.append(int(search_params['year_to']))

        if search_params.get('color'):
            query += " AND s.color_palette LIKE %s"
            params.append(f"%{search_params['color']}%")

        if search_params.get('set_name'):
            query += " AND st.name LIKE %s"
            params.append(f"%{search_params['set_name']}%")

        # Add ordering
        query += " ORDER BY st.year DESC, s.stamp_id DESC"

        # Execute query
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        connection.close()

        return jsonify({
            'stamps': results,
            'total_count': len(results)
        })

    except Exception as e:
        print(f"Error in search_stamps: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stamps/estimate', methods=['POST'])
def estimate_stamps():
    try:
        search_params = request.json
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Initialize conditions and parameters for the query
        conditions = ["1=1"]
        params = []

        # Add search conditions (same as in search_stamps)
        if search_params.get('country'):
            conditions.append("st.country LIKE %s")
            params.append(f"%{search_params['country']}%")

        if search_params.get('year_from'):
            conditions.append("st.year >= %s")
            params.append(search_params['year_from'])

        if search_params.get('year_to'):
            conditions.append("st.year <= %s")
            params.append(search_params['year_to'])

        # Quick count query using only essential joins
        count_query = f"""
            SELECT COUNT(*) as total 
            FROM sets st
            INNER JOIN stamps s ON s.set_id = st.set_id
            WHERE {' AND '.join(conditions)}
        """
        
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            'estimated_count': total_count
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def hex_to_hsl(hex_color):
    # Remove the hash if it exists
    hex_color = hex_color.lstrip('#')
    
    # Convert hex to RGB
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    
    # Convert RGB to HSL
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    
    # Convert to degrees and percentages
    h = h * 360
    s = s * 100
    l = l * 100
    
    return h, s, l

def are_colors_similar(color1_hex, color2_hex, tolerance_degrees):
    """
    Compare two colors in HSL space with variable tolerance
    """
    # Convert hex to HSL
    def hex_to_hsl(hex_color):
        # Remove the # if present
        hex_color = hex_color.lstrip('#')
        # Convert hex to RGB
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        # Convert RGB to HSL
        r, g, b = [x/255.0 for x in rgb]
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        l = (max_c + min_c) / 2.0
        
        if max_c == min_c:
            h = s = 0.0
        else:
            d = max_c - min_c
            s = d / (2.0 - max_c - min_c) if l > 0.5 else d / (max_c + min_c)
            if max_c == r:
                h = (g - b) / d + (6.0 if g < b else 0.0)
            elif max_c == g:
                h = (b - r) / d + 2.0
            else:
                h = (r - g) / d + 4.0
            h *= 60.0
            if h < 0:
                h += 360.0
                
        return (h, s * 100, l * 50)

    # Get HSL values
    h1, s1, _ = hex_to_hsl(color1_hex)
    h2, s2, _ = hex_to_hsl(color2_hex)
    
    # Calculate color delta (difference in saturation)
    delta = abs(s1 - s2) / 100.0
    
    # Adjust tolerance based on delta
    adjusted_tolerance = tolerance_degrees * (1 + (1 - delta) * 2)
    
    # Calculate hue difference considering the circular nature of hue
    hue_diff = min(abs(h1 - h2), 360 - abs(h1 - h2))
    
    # Colors are similar if within adjusted tolerance
    return hue_diff <= adjusted_tolerance

if __name__ == '__main__':
    app.run(debug=True)