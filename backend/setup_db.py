import psycopg2

def setup_database():
    print("Connecting to PostgreSQL container...")
    try:
        # Credentials match your docker-compose.dev.yml file
        conn = psycopg2.connect(
            dbname="rfp_engine",
            user="admin",
            password="devpassword",
            host="localhost",
            port="5432"
        )
        conn.autocommit = True
        cursor = conn.cursor()

        print("Reading schema.sql...")
        with open("schema.sql", "r") as file:
            sql = file.read()

        print("Injecting enterprise schema and RLS policies...")
        cursor.execute(sql)
        
        print("Success! Database is now multi-tenant ready.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_database()