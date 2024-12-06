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

        # Filter results by color if hue and saturation are provided
        if search_params.get('hue') is not None and search_params.get('saturation') is not None:
            hue = float(search_params['hue'])
            saturation = float(search_params['saturation'])
            tolerance = float(search_params.get('tolerance', 15))  # Default tolerance of 15
            
            filtered_results = []
            for result in results:
                if result['color_palette']:
                    try:
                        # Clean and parse the color palette string
                        # Format: '[''#e6e2e0'', ''#cd98a9'', ''#dfb6c3'', ''#ccb6ba'', ''#c4acac'']'
                        color_str = result['color_palette'].strip('[]')
                        colors = [c.strip().strip("'") for c in color_str.split(',')]
                        colors = [c.strip("'") for c in colors]  # Remove additional quotes
                        
                        # Check if any color in the palette matches the target hue/saturation
                        if any(color_matches(color, hue, saturation, tolerance) for color in colors if color.startswith('#')):
                            filtered_results.append(result)
                    except Exception as e:
                        print(f"Error processing color palette: {str(e)}")
                        continue
            results = filtered_results

        return jsonify({
            'stamps': results,
            'total_count': len(results)
        })

    except Exception as e:
        print(f"Error in search_stamps: {str(e)}")
        return jsonify({'error': str(e)}), 500

def rgb_to_hsv(r, g, b):
    r, g, b = r/255.0, g/255.0, b/255.0
    cmax = max(r, g, b)
    cmin = min(r, g, b)
    diff = cmax - cmin

    if cmax == cmin:
        h = 0
    elif cmax == r:
        h = (60 * ((g-b)/diff) + 360) % 360
    elif cmax == g:
        h = (60 * ((b-r)/diff) + 120) % 360
    else:
        h = (60 * ((r-g)/diff) + 240) % 360

    s = 0 if cmax == 0 else (diff / cmax) * 100
    v = cmax * 100
    return h, s, v

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def color_matches(color_hex, target_hue, target_saturation, tolerance):
    try:
        r, g, b = hex_to_rgb(color_hex)
        h, s, v = rgb_to_hsv(r, g, b)
        
        # Compare hue with tolerance, considering the circular nature of hue
        hue_diff = min((h - target_hue) % 360, (target_hue - h) % 360)
        hue_matches = hue_diff <= tolerance
        
        # Compare saturation with tolerance
        saturation_diff = abs(s - target_saturation)
        saturation_matches = saturation_diff <= tolerance
        
        return hue_matches and saturation_matches
    except:
        return False

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

if __name__ == '__main__':
    app.run(debug=True)