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
        search_params = request.json
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Initialize conditions and parameters for the query
        conditions = ["1=1"]  # Base condition that's always true
        params = []

        # Add non-color conditions first
        if search_params.get('username'):
            query = " LEFT JOIN users usr ON u.user_id = usr.user_id"
            conditions.append("usr.username = %s")
            params.append(search_params['username'])

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

        # Build the base query with all non-color conditions
        base_query = f"""
            SELECT DISTINCT 
                s.stamp_id, s.number, s.type, s.denomination, s.description,
                s.date_of_issue, s.color_palette, s.perforations,
                s.perforation_horizontal, s.perforation_vertical, s.perforation_keyword,
                s.sheet_size, s.sheet_size_amount, s.sheet_size_x, s.sheet_size_y,
                s.height_width, s.height, s.width, s.number_issued,
                s.value_from, s.value_to, s.image_path, s.set_id,
                s.mint_condition, s.unused, s.used, s.letter_fdc,
                s.mint_condition_float, s.unused_float, s.used_float, s.letter_fdc_float,
                st.name as set_name, st.year, st.country, st.category,
                u.amount_used, u.amount_unused, u.amount_letter_fdc
            FROM sets st
            INNER JOIN stamps s ON s.set_id = st.set_id
            LEFT JOIN user_stamps u ON s.stamp_id = u.stamp_id
            WHERE {' AND '.join(conditions)}
            AND st.country LIKE %s
        """
        params.append('%DDR%')  # Add the country filter parameter

        # If color filtering is needed, wrap the base query in a subquery
        if search_params.get('hue') is not None and search_params.get('saturation') is not None:
            target_hue = search_params['hue']
            target_saturation = search_params['saturation']
            
            # Create color matching function
            cursor.execute("""
                DROP FUNCTION IF EXISTS are_colors_similar;
            """)
            
            cursor.execute("""
                CREATE FUNCTION are_colors_similar(hex_color VARCHAR(50), target_hue FLOAT, target_sat FLOAT, tolerance FLOAT)
                RETURNS BOOLEAN
                DETERMINISTIC
                BEGIN
                    DECLARE r, g, b, max_val, min_val, h, s, delta, hue_diff FLOAT;
                    DECLARE clean_hex VARCHAR(50);
                    
                    -- Clean and validate the hex color
                    SET clean_hex = TRIM(BOTH ' ' FROM hex_color);
                    IF LENGTH(clean_hex) < 7 OR LEFT(clean_hex, 1) != '#' THEN
                        RETURN FALSE;
                    END IF;
                    
                    -- Extract just the first 7 characters for a valid hex color
                    SET clean_hex = LEFT(clean_hex, 7);
                    
                    -- Validate hex digits
                    IF NOT (clean_hex REGEXP '^#[0-9A-Fa-f]{6}$') THEN
                        RETURN FALSE;
                    END IF;
                    
                    -- Convert hex to RGB
                    SET r = CONV(SUBSTRING(clean_hex, 2, 2), 16, 10) / 255;
                    SET g = CONV(SUBSTRING(clean_hex, 4, 2), 16, 10) / 255;
                    SET b = CONV(SUBSTRING(clean_hex, 6, 2), 16, 10) / 255;
                    
                    -- Find max and min values
                    SET max_val = GREATEST(r, g, b);
                    SET min_val = LEAST(r, g, b);
                    SET delta = max_val - min_val;
                    
                    -- Calculate hue
                    IF delta = 0 THEN
                        SET h = 0;
                    ELSEIF max_val = r THEN
                        SET h = 60 * (MOD((g - b) / delta, 6));
                    ELSEIF max_val = g THEN
                        SET h = 60 * ((b - r) / delta + 2);
                    ELSE
                        SET h = 60 * ((r - g) / delta + 4);
                    END IF;
                    
                    IF h < 0 THEN
                        SET h = h + 360;
                    END IF;
                    
                    -- Calculate saturation
                    IF max_val = 0 THEN
                        SET s = 0;
                    ELSE
                        SET s = (delta / max_val) * 100;
                    END IF;
                    
                    -- Compare hue and saturation with tolerance
                    SET hue_diff = ABS(h - target_hue);
                    IF hue_diff > 180 THEN
                        SET hue_diff = 360 - hue_diff;
                    END IF;
                    
                    RETURN hue_diff <= tolerance AND ABS(s - target_sat) <= tolerance;
                END;
            """)
            
            # Wrap the base query and add color filtering
            final_query = f"""
                WITH RECURSIVE
                numbers AS (
                    SELECT 1 as n
                    UNION ALL
                    SELECT n + 1 FROM numbers WHERE n < 5  -- Most color palettes have 5 colors
                ),
                base_results AS ({base_query}),
                valid_stamps AS (
                    SELECT * FROM base_results 
                    WHERE color_palette IS NOT NULL 
                    AND color_palette != '[]'
                ),
                color_split AS (
                    SELECT 
                        stamp_id,
                        TRIM(BOTH ' #' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(TRIM(BOTH '[]' FROM REPLACE(color_palette, "'", '')), ',', n), ',', -1)) as color
                    FROM valid_stamps
                    CROSS JOIN numbers
                    WHERE n <= (LENGTH(color_palette) - LENGTH(REPLACE(color_palette, ',', '')) + 1)
                )
                SELECT DISTINCT vs.*
                FROM valid_stamps vs
                WHERE EXISTS (
                    SELECT 1 FROM color_split cs
                    WHERE cs.stamp_id = vs.stamp_id
                    AND cs.color != ''
                    AND are_colors_similar(CONCAT('#', cs.color), {target_hue}, {target_saturation}, 10)
                )
                ORDER BY year DESC, stamp_id DESC
            """
        else:
            final_query = f"{base_query} ORDER BY st.year DESC, s.stamp_id DESC"

        # First analyze the query execution plan
        cursor.execute(f"EXPLAIN ANALYZE {final_query}", params)
        explain_results = cursor.fetchall()
        print("\nQuery Execution Plan:")
        for row in explain_results:
            print(row)

        # Then execute the actual query
        cursor.execute(final_query, params)
        stamps = cursor.fetchall()

        # Process the results
        for stamp in stamps:
            # Convert date objects to string format
            if stamp.get('date_of_issue'):
                stamp['date_of_issue'] = stamp['date_of_issue'].isoformat()

        cursor.close()
        connection.close()

        # print the amount of rows of the result
        print(len(stamps))

        return jsonify(stamps)

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

def are_colors_similar(h1, s1, h2, s2, tolerance=10):
    # Handle circular nature of hue
    hue_diff = abs(h1 - h2)
    if hue_diff > 180:
        hue_diff = 360 - hue_diff
    
    # Compare both hue and saturation with tolerance
    return hue_diff <= tolerance and abs(s1 - s2) <= tolerance

if __name__ == '__main__':
    app.run(debug=True)