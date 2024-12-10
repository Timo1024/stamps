import mysql.connector
import json

# Database connection
def get_db_connection():
    with open("../crawling/tokens.json") as f:
        passwords = json.load(f)

    pwd=passwords["mysql_password_laptop"]
    # pwd=passwords["mysql_password"]

    # Connect to MySQL
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=pwd,
        database='stampcollection'
    )

    return connection

# Retrieve the user_id for user name
def get_user_id_by_username(username, cursor):
    query = "SELECT user_id FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    result = cursor.fetchone()
    if result:
        return result['user_id']
    else:
        raise ValueError(f"User '{username}' not found.")

