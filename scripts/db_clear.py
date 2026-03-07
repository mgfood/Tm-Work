import os
import sys
import psycopg2
from pathlib import Path

def load_env():
    env_path = Path(__file__).parent.parent / 'backend' / '.env'
    env_vars = {}
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    return env_vars

def clear_sqlite(db_name):
    db_path = Path(__file__).parent.parent / 'backend' / f"{db_name}.sqlite3"
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / 'backend' / db_name # Try without extension if specified in name
        if not db_path.exists():
            print(f"[-] Файл БД {db_name} не найден.")
            return

    try:
        os.remove(db_path)
        print(f"[+] База данных SQLite ({db_name}) удалена.")
    except Exception as e:
        print(f"[!] Ошибка при удалении SQLite: {e}")

def clear_postgres(vars):
    try:
        conn = psycopg2.connect(
            dbname=vars.get('DB_NAME'),
            user=vars.get('DB_USER'),
            password=vars.get('DB_PASSWORD'),
            host=vars.get('DB_HOST', 'localhost'),
            port=vars.get('DB_PORT', '5432')
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Получаем все таблицы
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        
        if not tables:
            print("[*] Таблиц в БД нет.")
            return

        print(f"[*] Очистка {len(tables)} таблиц в PostgreSQL...")
        for table in tables:
            cur.execute(f'DROP TABLE IF EXISTS "{table[0]}" CASCADE;')
        
        print("[+] Все таблицы удалены.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[!] Ошибка PostgreSQL: {e}")

def main():
    print("="*50)
    print("Скрипт очистки Базы Данных TmWork")
    print("="*50)
    
    env = load_env()
    engine = env.get('DB_ENGINE', 'sqlite3')
    db_name = env.get('DB_NAME', 'tmwork_dev')

    if 'sqlite' in engine.lower():
        print(f"[*] Обнаружена SQLite: {db_name}")
        clear_sqlite(db_name)
    elif 'postgres' in engine.lower():
        print(f"[*] Обнаружена PostgreSQL: {db_name}")
        clear_postgres(env)
    else:
        print(f"[!] Неизвестный движок БД: {engine}")

    print("\n[*] Не забудьте выполнить миграции: python backend/manage.py migrate")

if __name__ == "__main__":
    main()
