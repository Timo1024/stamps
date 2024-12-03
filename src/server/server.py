from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import mysql.connector
import json

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
        search_params = request.json
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Start building the base query
        query = """
            SELECT DISTINCT s.*, st.*, u.amount_used, u.amount_unused, u.amount_letter_fdc
            FROM stamps s
            JOIN sets st ON s.set_id = st.set_id
            LEFT JOIN user_stamps u ON s.stamp_id = u.stamp_id
        """
        conditions = []
        params = []

        # Add user condition if username is provided
        if search_params.get('username'):
            query += " LEFT JOIN users usr ON u.user_id = usr.user_id"
            conditions.append("usr.username = %s")
            params.append(search_params['username'])

        # Add conditions for each search parameter
        if search_params.get('country'):
            conditions.append("st.country LIKE %s")
            params.append(f"%{search_params['country']}%")

        if search_params.get('year_from'):
            conditions.append("st.year >= %s")
            params.append(search_params['year_from'])

        if search_params.get('year_to'):
            conditions.append("st.year <= %s")
            params.append(search_params['year_to'])

        if search_params.get('denomination'):
            conditions.append("s.denomination LIKE %s")
            params.append(f"%{search_params['denomination']}%")

        if search_params.get('theme'):
            conditions.append("s.themes LIKE %s")
            params.append(f"%{search_params['theme']}%")

        if search_params.get('keywords'):
            keyword_conditions = []
            for keyword in search_params['keywords']:
                keyword_conditions.append(
                    "(s.description LIKE %s OR st.set_description LIKE %s OR s.themes LIKE %s)"
                )
                params.extend([f"%{keyword}%"] * 3)
            if keyword_conditions:
                conditions.append(f"({' OR '.join(keyword_conditions)})")

        if search_params.get('colors'):
            color_conditions = []
            for color in search_params['colors']:
                color_conditions.append("s.color LIKE %s")
                params.append(f"%{color}%")
            if color_conditions:
                conditions.append(f"({' OR '.join(color_conditions)})")

        if search_params.get('date_of_issue'):
            conditions.append("s.date_of_issue = %s")
            params.append(search_params['date_of_issue'])

        if search_params.get('category'):
            conditions.append("st.category = %s")
            params.append(search_params['category'])

        if search_params.get('number_issued'):
            conditions.append("s.number_issued = %s")
            params.append(search_params['number_issued'])

        if search_params.get('perforation_horizontal'):
            conditions.append("s.perforation_horizontal = %s")
            params.append(search_params['perforation_horizontal'])

        if search_params.get('perforation_vertical'):
            conditions.append("s.perforation_vertical = %s")
            params.append(search_params['perforation_vertical'])

        if search_params.get('perforation_keyword'):
            conditions.append("s.perforation_keyword LIKE %s")
            params.append(f"%{search_params['perforation_keyword']}%")

        if search_params.get('sheet_size_amount'):
            conditions.append("s.sheet_size_amount = %s")
            params.append(search_params['sheet_size_amount'])

        if search_params.get('sheet_size_horizontal'):
            conditions.append("s.sheet_size_x = %s")
            params.append(search_params['sheet_size_horizontal'])

        if search_params.get('sheet_size_vertical'):
            conditions.append("s.sheet_size_y = %s")
            params.append(search_params['sheet_size_vertical'])

        if search_params.get('stamp_size_horizontal'):
            conditions.append("s.width = %s")
            params.append(search_params['stamp_size_horizontal'])

        if search_params.get('stamp_size_vertical'):
            conditions.append("s.height = %s")
            params.append(search_params['stamp_size_vertical'])

        if search_params.get('color'):
            conditions.append("s.color_palette IS NOT NULL")

        # Add WHERE clause if there are conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Add ordering
        query += " ORDER BY st.year DESC, s.stamp_id DESC"

        # Execute query with parameters
        cursor.execute(query, params)
        stamps = cursor.fetchall()

        # Process the results
        for stamp in stamps:
            # Convert date objects to string format
            if stamp.get('date_of_issue'):
                stamp['date_of_issue'] = stamp['date_of_issue'].isoformat()

        # Filter by color if specified
        if search_params.get('color'):
            def hex_to_rgb(hex_color):
                hex_color = hex_color.lstrip('#')
                return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

            def color_distance(color1, color2):
                r1, g1, b1 = hex_to_rgb(color1)
                r2, g2, b2 = hex_to_rgb(color2)
                return ((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) ** 0.5

            def is_color_match(target_color, color_palette, delta=100):
                if not color_palette:
                    return False
                try:
                    colors = eval(color_palette)
                    return any(color_distance(target_color, color) <= delta for color in colors)
                except:
                    return False

            target_color = search_params['color']
            stamps = [
                row for row in stamps 
                if is_color_match(target_color, row.get('color_palette'))
            ]

        cursor.close()
        connection.close()

        # print the amount of rows of the result
        print(len(stamps))

        return jsonify(stamps)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)