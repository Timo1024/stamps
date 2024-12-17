from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import mysql.connector
import os
import json
import re
import colorsys
from utils.database_helpers import get_user_id_by_username, get_db_connection
import bcrypt
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Authentication endpoints
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if username already exists
        cursor.execute('SELECT user_id FROM users WHERE username = %s', (username,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username already exists'}), 400

        # Check if email already exists
        cursor.execute('SELECT user_id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Email already exists'}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Insert new user
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)',
            (username, email, hashed_password)
        )
        connection.commit()

        return jsonify({'success': True, 'message': 'Registration successful'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not all([username, password]):
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get user
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'username': user['username'],
                'email': user['email']
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

# Route to fetch stamps based on set_id
# @app.route('/api/stamps/by_set_id/<int:set_id>', methods=['GET'])
# def get_stamps_by_set_id(set_id):
#     connection = get_db_connection()
#     cursor = connection.cursor(dictionary=True)
#     query = f"""
#         SELECT * FROM stamps
#         WHERE set_id = {set_id}
#     """
#     cursor.execute(query)
#     stamps = cursor.fetchall()
#     cursor.close()
#     connection.close()

#     return jsonify(stamps)

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

# get all stamp info by id
@app.route('/api/stamps/<int:stamp_id>', methods=['GET'])
def get_stamp_by_id(stamp_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = f"""
        SELECT * FROM stamps
        JOIN sets ON stamps.set_id = sets.set_id
        WHERE stamps.stamp_id = {stamp_id}
    """
    cursor.execute(query)
    stamp = cursor.fetchone()
    cursor.close()
    connection.close()

    return jsonify(stamp)

# get all stamp ids from a set_id
@app.route('/api/stamps/set/<int:set_id>', methods=['GET'])
def get_stamp_ids_by_set_id(set_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = f"""
        SELECT stamp_id FROM stamps
        WHERE set_id = {set_id}
        AND themes IS NOT NULL
    """
    cursor.execute(query)
    stamps = [stamp['stamp_id'] for stamp in cursor.fetchall()]
    cursor.close()
    connection.close()

    return jsonify(stamps)

# get image link by stamp_id
@app.route('/api/stamps/get_image_link/<int:stamp_id>', methods=['GET'])
def get_image_path_by_stamp_id(stamp_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query = f"""
        SELECT image_path FROM stamps
        WHERE stamp_id = {stamp_id}
    """
    cursor.execute(query)
    image_path = cursor.fetchone()['image_path']
    cursor.close()
    connection.close()

    return jsonify(image_path)

# search endpoint to handle all search parameters
@app.route('/api/stamps/search', methods=['POST'])
def search_stamps():
    try:
        search_params = request.get_json()
        
        # Validate and correct year inputs
        year_from = search_params.get('year_from')
        year_to = search_params.get('year_to')
        
        # Ensure year inputs are valid
        if year_from is not None:
            try:
                year_from = int(year_from)
                if year_from < 1800 or year_from > 2100:
                    print(f"Warning: Unusual year_from value: {year_from}")
            except ValueError:
                print(f"Invalid year_from: {year_from}")
                year_from = None

        if year_to is not None:
            try:
                year_to = int(year_to)
                if year_to < 1800 or year_to > 2100:
                    print(f"Warning: Unusual year_to value: {year_to}")
            except ValueError:
                print(f"Invalid year_to: {year_to}")
                year_to = None

        # Build the base query
        query = """
            SELECT 
                -- Sets table fields
                st.set_id,
                st.country,
                st.category,
                st.year,
                st.url,
                st.name AS set_name,
                st.set_description,
                
                -- Stamps table fields
                s.stamp_id,
                s.denomination,
                s.color,
                s.description,
                s.stamps_issued,
                s.mint_condition,
                s.unused,
                s.used,
                s.letter_fdc,
                s.date_of_issue,
                s.perforations,
                s.sheet_size,
                s.designed,
                s.engraved,
                s.height_width,
                s.themes,
                s.perforation_horizontal,
                s.perforation_vertical,
                s.perforation_keyword,
                s.value_from,
                s.value_to,
                s.number_issued,
                s.mint_condition_float,
                s.unused_float,
                s.used_float,
                s.letter_fdc_float,
                s.sheet_size_amount,
                s.sheet_size_x,
                s.sheet_size_y,
                s.sheet_size_note,
                s.height,
                s.width,
                s.image_path,
                s.color_palette,
                
                -- User stamps fields
                us.amount_used,
                us.amount_unused,
                us.amount_minted,
                us.amount_letter_fdc,
                us.note,
                us.added_at
            FROM stamps s
            JOIN sets st ON s.set_id = st.set_id
            LEFT JOIN users u ON u.username = %s
            LEFT JOIN user_stamps us ON s.stamp_id = us.stamp_id AND us.user_id = u.user_id
            WHERE 1=1
        """
        # Add username as the first parameter
        params = [search_params.get('username', '')]

        # If 'show_owned' is True, add condition to filter only owned stamps
        if search_params.get('show_owned'):
            query += """
                AND (us.amount_used > 0 OR 
                     us.amount_unused > 0 OR 
                     us.amount_minted > 0 OR 
                     us.amount_letter_fdc > 0)
            """

        # Add conditions for non-username filters
        if search_params.get('country'):
            query += " AND st.country LIKE %s"
            params.append(f"%{search_params['country']}%")
        
        if year_from is not None:
            query += " AND st.year >= %s"
            params.append(year_from)
            
        if year_to is not None:
            query += " AND st.year <= %s"
            params.append(year_to)

        if search_params.get('set_name'):
            query += " AND st.name LIKE %s"
            params.append(f"%{search_params['set_name']}%")

        # Theme filtering
        if search_params.get('theme'):
            query += " AND s.themes LIKE %s"
            params.append(f"%{search_params['theme']}%")

        # Denomination filtering
        if search_params.get('denomination'):
            try:
                denomination = float(search_params['denomination'])
                # print(f"Searching for denomination: {denomination}")
                # Use a range-based approach to handle floating-point imprecision
                query += " AND (s.value_from <= %s AND s.value_to >= %s)"
                # Add a small tolerance to handle floating-point comparison
                params.extend([denomination + 0.001, denomination - 0.001])
                # print(f"Denomination range: {denomination - 0.001} to {denomination + 0.001}")
            except ValueError:
                print(f"Invalid denomination: {search_params['denomination']}")

        # Keyword filtering
        if search_params.get('keywords'):
            # Handle both list and string inputs
            keywords = search_params['keywords']
            if isinstance(keywords, str):
                keywords = [kw.strip() for kw in keywords.split(',') if kw.strip()]
            elif isinstance(keywords, list):
                keywords = [str(kw).strip() for kw in keywords if kw]
            
            # Construct a complex condition to check if ALL keywords are present
            keyword_conditions = []
            for keyword in keywords:
                keyword_conditions.append("""
                    (
                        s.description LIKE %s OR 
                        st.name LIKE %s OR 
                        st.set_description LIKE %s
                    )
                """)
                params.extend([f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"])
            
            # Combine keyword conditions
            if keyword_conditions:
                query += " AND " + " AND ".join(f"({cond})" for cond in keyword_conditions)

        # Add themes filter
        query += " AND (s.themes IS NOT NULL AND s.themes != '[]')"

        # Add ordering and limit
        query += " ORDER BY st.year DESC, s.stamp_id DESC LIMIT 1000"

        # Execute query
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Debug logging
        # print("Search Query:", query)
        # print("Search Params:", search_params)
        # print("Query Params:", params)
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Print additional debug information
        # print(f"Total results: {len(results)}")
        # if len(results) > 0:
        #     print("Sample results:")
        #     for result in results[:5]:  # Print first 5 results
        #         print(f"Stamp ID: {result['stamp_id']}, Country: {result['country']}, Year: {result['year']}, Set Name: {result['set_name']}")

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

@app.route('/api/stamps/estimate', methods=['POST'])
def estimate_stamps():
    try:
        search_params = request.json
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Initialize conditions and parameters for the query
        conditions = ["1=1"]
        params = []

        # Add search conditions
        if search_params.get('country'):
            conditions.append("st.country LIKE %s")
            params.append(f"%{search_params['country']}%")

        if search_params.get('year_from'):
            conditions.append("st.year >= %s")
            params.append(search_params['year_from'])

        if search_params.get('year_to'):
            conditions.append("st.year <= %s")
            params.append(search_params['year_to'])

        # Add username filter if provided
        if search_params.get('username'):
            conditions.append("""
                s.stamp_id IN (
                    SELECT stamp_id 
                    FROM user_stamps us 
                    JOIN users u ON us.user_id = u.user_id 
                    WHERE u.username = %s
                )
            """)
            params.append(search_params['username'])

        # Quick count query using joins for username filtering
        count_query = f"""
            SELECT COUNT(DISTINCT s.stamp_id) as total 
            FROM sets st
            INNER JOIN stamps s ON s.set_id = st.set_id
            WHERE {' AND '.join(conditions)}
            AND s.themes IS NOT NULL
            AND s.themes != '[]'
        """
        
        # Print debug information
        print("Estimate Query:", count_query)
        print("Estimate Params:", params)
        
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['total']

        print(f"Estimated total count: {total_count}")

        cursor.close()
        connection.close()

        return jsonify({
            'estimated_count': total_count
        })

    except Exception as e:
        print(f"Error in estimate_stamps: {str(e)}")
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

if __name__ == '__main__':
    app.run(debug=True)