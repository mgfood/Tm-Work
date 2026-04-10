import os
import sys
import time
import socket
import subprocess
from pathlib import Path

# --- Конфигурация ---
SCRIPTS_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPTS_DIR.parent.parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
LOGS_DIR = ROOT_DIR / "logs"

# Создаем папку для логов
LOGS_DIR.mkdir(exist_ok=True)

# Интерпретатор Python из venv (Windows)
VENV_PYTHON = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

# Цвета и управление терминалом
class C:
    H = '\033[95m'
    B = '\033[94m'
    CY = '\033[96m'
    G = '\033[92m'
    Y = '\033[93m'
    R = '\033[91m'
    E = '\033[0m'
    BOLD = '\033[1m'
    
    # ANSI-коды для режима приложения
    ENTER_ALT = "\033[?1049h"
    EXIT_ALT = "\033[?1049l"
    HIDE_CURSOR = "\033[?25l"
    SHOW_CURSOR = "\033[?25h"
    CLEAR = "\033[H\033[2J"

# Состояние
running_processes = []
active_mode = "НЕТ"

def get_ipv4():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def print_header():
    sys.stdout.write(C.CLEAR)
    ip = get_ipv4()
    print(f"{C.B}╔════════════════════════════════════════════════════════╗{C.E}")
    print(f"{C.B}║{C.E} 🚀 {C.BOLD}{C.H}       Центр управления TmWork (WINDOWS v4.0-RU){C.E}     {C.B}║{C.E}")
    print(f"{C.B}╠════════════════════════════════════════════════════════╣{C.E}")
    print(f"{C.B}║{C.E} 🌐 {C.G}Веб-интерфейс:{C.E} {C.BOLD}http://{ip}:3000{C.E}                {C.B}║{C.E}")
    print(f"{C.B}║{C.E} 🔗 {C.G}Корневой API: {C.E} {C.BOLD}http://{ip}:8000{C.E}                {C.B}║{C.E}")
    print(f"{C.B}╚════════════════════════════════════════════════════════╝{C.E}")

def check_postgres():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect(('localhost', 5432))
        s.close()
        return True
    except:
        return False

def start_postgres():
    print(f"\n{C.CY}🐘 [ЗАПРОС] PostgreSQL не запущен.{C.E}")
    choice = input(f"{C.Y}[?] Запустить локально через 'net start'? (y/n): {C.E}").lower()
    if choice == 'y':
        services = ["postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14", "postgresql"]
        for svc in services:
            print(f"{C.CY}[*] Попытка запуска {svc}...{C.E}")
            res = subprocess.run(f"net start {svc}", shell=True, capture_output=True)
            if res.returncode == 0:
                print(f"{C.G}[+] Запущено.{C.E}")
                time.sleep(1)
                return

def kill_processes():
    global active_mode
    if not running_processes:
        return
    
    print(f"\n{C.Y}🛑 Останавливаю сервисы...{C.E}")
    for name, proc in running_processes:
        try:
            print(f"    - Завершаю {name} (PID: {proc.pid})")
            subprocess.run(f"taskkill /F /T /PID {proc.pid} >nul 2>&1", shell=True)
        except:
            pass
    
    # Очистка node и python
    subprocess.run("taskkill /F /IM node.exe /T >nul 2>&1", shell=True)
    subprocess.run('wmic process where "commandline like \'%manage.py runserver%\'" call terminate >nul 2>&1', shell=True)
    
    running_processes.clear()
    active_mode = "НЕТ"
    print(f"{C.G}✅ Все сервисы остановлены.{C.E}")

def launch_services(mode):
    global active_mode
    if running_processes:
        print(f"{C.R}⚠️ Сервисы уже запущены!{C.E}")
        time.sleep(1)
        return

    if not check_postgres():
        start_postgres()

    print(f"\n{C.CY}🛠 Запуск в режиме {C.BOLD}{mode.upper()}{C.E}{C.CY}...{C.E}")
    
    try:
        be_cmd = [str(VENV_PYTHON), "manage.py", "runserver", "0.0.0.0:8000"]
        fe_cmd = "npm run dev"

        if mode == "silent":
            be_proc = subprocess.Popen(be_cmd, cwd=BACKEND_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            fe_proc = subprocess.Popen(fe_cmd, cwd=FRONTEND_DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            active_mode = "ТИХИЙ"

        elif mode == "window":
            # Режим отдельных окон для Windows
            be_win_cmd = f'start "ЛОГИ БЭКЕНДА" cmd /k "{VENV_PYTHON} manage.py runserver 0.0.0.0:8000"'
            fe_win_cmd = f'start "ЛОГИ ФРОНТЕНДА" cmd /k "npm run dev"'
            
            subprocess.Popen(be_win_cmd, shell=True, cwd=BACKEND_DIR)
            subprocess.Popen(fe_win_cmd, shell=True, cwd=FRONTEND_DIR)
            
            # Заглушки
            be_proc = subprocess.Popen(["cmd.exe", "/c", "timeout", "/t", "1000000"], stdout=subprocess.DEVNULL)
            fe_proc = subprocess.Popen(["cmd.exe", "/c", "timeout", "/t", "1000000"], stdout=subprocess.DEVNULL)
            active_mode = "ОКНА"

        elif mode == "file":
            be_log = open(LOGS_DIR / "backend.log", "a")
            fe_log = open(LOGS_DIR / "frontend.log", "a")
            be_proc = subprocess.Popen(be_cmd, cwd=BACKEND_DIR, stdout=be_log, stderr=be_log)
            fe_proc = subprocess.Popen(fe_cmd, cwd=FRONTEND_DIR, shell=True, stdout=fe_log, stderr=fe_log)
            active_mode = f"ЛОГИ ({LOGS_DIR.name}\\)"

        running_processes.append(("Бэкенд", be_proc))
        running_processes.append(("Фронтенд", fe_proc))
        
        print(f"{C.G}✅ Сервисы запущены!{C.E}")
        time.sleep(1.5)
    except Exception as e:
        print(f"{C.R}❌ Ошибка: {e}{C.E}")
        kill_processes()
        input("\nНажмите Enter для продолжения...")

def db_reset_menu():
    print(f"\n{C.CY}🧹 --- СБРОС БАЗЫ ДАННЫХ ---{C.E}")
    print(f" {C.BOLD}[1]{C.E} SQLite (Удалить db.sqlite3)")
    print(f" {C.BOLD}[2]{C.E} PostgreSQL (Сброс схемы Public)")
    print(f" {C.BOLD}[0]{C.E} Отмена")
    
    sys.stdout.write(C.SHOW_CURSOR)
    sys.stdout.flush()
    db_choice = input(f"\n{C.BOLD}Выбор > {C.E}").strip()
    sys.stdout.write(C.HIDE_CURSOR)
    sys.stdout.flush()
    
    if db_choice == '1':
        run_tool("Очистка SQLite", "🧹", f'"{VENV_PYTHON}" {ROOT_DIR}\\scripts\\db_clear.py --sqlite', BACKEND_DIR)
    elif db_choice == '2':
        run_tool("Очистка Postgres", "🧹", f'"{VENV_PYTHON}" {ROOT_DIR}\\scripts\\db_clear.py --postgres', BACKEND_DIR)
    else:
        print(f"{C.Y}[!] Сброс отменен.{C.E}")
        time.sleep(0.5)

def run_tool(name, icon, command, cwd):
    print(f"\n{C.CY}{icon} Выполняю: {C.BOLD}{name}{C.E}...{C.E}")
    try:
        subprocess.run(command, cwd=cwd, shell=True)
    except Exception as e:
        print(f"{C.R}❌ Ошибка: {e}{C.E}")
    input("\nЗадача завершена. Нажмите Enter для возврата в меню...")

def main():
    if os.name == 'nt':
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)

    sys.stdout.write(C.ENTER_ALT + C.HIDE_CURSOR)
    sys.stdout.flush()

    try:
        while True:
            print_header()
            
            pg_status = f"{C.G}В СЕТИ{C.E}" if check_postgres() else f"{C.R}ОФФЛАЙН{C.E}"
            sv_status = f"{C.G}ЗАПУЩЕНЫ{C.E}" if running_processes else f"{C.Y}ОСТАНОВЛЕНЫ{C.E}"
            
            print(f" 📡 {C.BOLD}СТАТУС:{C.E} БД: {pg_status} | Сервисы: {sv_status} [Режим: {C.CY}{active_mode}{C.E}]")
            print(f"{C.B}──────────────────────────────────────────────────────────{C.E}")
            print(f" {C.BOLD}[1]{C.E} 🚀 {C.G}ТИХИЙ ЗАПУСК{C.E} (В фоне, без логов)")
            print(f" {C.BOLD}[2]{C.E} 🪟 ЗАПУСК В ОКНАХ{C.E} (2 новых терминала с логами)")
            print(f" {C.BOLD}[3]{C.E} 📝 ЗАПУСК С ЛОГАМИ{C.E} (Запись в logs/*.log)")
            print(f" {C.BOLD}[X]{C.E} 🛑 ОСТАНОВИТЬ ВСЕ СЕРВИСЫ")
            print(f"{C.B}─────────────────── {C.BOLD}Инструменты разработки{C.E} ──────────────────{C.E}")
            print(f" {C.BOLD}[4]{C.E} 🏗️  Миграции")
            print(f" {C.BOLD}[5]{C.E} 🔑 Админка")
            print(f" {C.BOLD}[6]{C.E} 🧹 Сброс БД (Выбор)")
            print(f" {C.BOLD}[L]{C.E} 🌍 Локализация")
            print(f" {C.BOLD}[I]{C.E} 📦 Зависимости")
            print(f"{C.B}──────────────────────────────────────────────────────────{C.E}")
            print(f" {C.BOLD}[0]{C.E} 🚪 ВЫХОД")
            
            sys.stdout.write(C.SHOW_CURSOR)
            sys.stdout.flush()
            choice = input(f"\n{C.BOLD}Команда > {C.E}").strip().upper()
            sys.stdout.write(C.HIDE_CURSOR)
            sys.stdout.flush()
            
            if choice == '1': launch_services("silent")
            elif choice == '2': launch_services("window")
            elif choice == '3': launch_services("file")
            elif choice == 'X' or choice == 'Х': 
                kill_processes()
                time.sleep(1)
            elif choice == '4': run_tool("Миграции", "🏗️", f'"{VENV_PYTHON}" manage.py migrate', BACKEND_DIR)
            elif choice == '5' or choice == 'Ы': run_tool("Админка", "🔑", f'"{VENV_PYTHON}" manage.py createsuperuser', BACKEND_DIR)
            elif choice == '6':
                db_reset_menu()
            elif choice == 'L' or choice == 'Д' or choice == '7': run_tool("Локализация", "🌍", f'"{VENV_PYTHON}" {ROOT_DIR}\\scripts\\locales_check.py', BACKEND_DIR)
            elif choice == 'I' or choice == 'Ш' or choice == '8':
                print(f"\n{C.CY}📦 Загрузка зависимостей...{C.E}")
                subprocess.run("uv sync", cwd=BACKEND_DIR, shell=True)
                subprocess.run("npm install", cwd=FRONTEND_DIR, shell=True)
                input("\nГотово. Нажмите Enter...")
            elif choice == '0' or choice == "EXIT":
                kill_processes()
                break
            else:
                print(f"{C.R}❌ Ошибка ввода.{C.E}")
                time.sleep(0.5)
    finally:
        sys.stdout.write(C.SHOW_CURSOR + C.EXIT_ALT)
        sys.stdout.flush()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
