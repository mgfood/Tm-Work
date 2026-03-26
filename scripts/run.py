import subprocess
import os
import time
import socket
import sys
import datetime
import webbrowser
import threading

# --- Конфигурация ---
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
NGINX_DIR = os.path.join(ROOT_DIR, "nginx")
LOGS_DIR = os.path.join(ROOT_DIR, "logs")

# Цвета для консоли (ANSI)
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    MAGENTA = '\033[95m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Поиск Python в виртуальном окружении
if sys.platform == "win32":
    VENV_PYTHON = os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe")
else:
    VENV_PYTHON = os.path.join(BACKEND_DIR, ".venv", "bin", "python")

if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

# --- Вспомогательные функции ---

def get_ipv4():
    """Получает локальный IP адрес для доступа по сети."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def ensure_logs_dir():
    if not os.path.exists(LOGS_DIR):
        os.makedirs(LOGS_DIR)

def get_log_file():
    ensure_logs_dir()
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    return os.path.join(LOGS_DIR, f"session_{date_str}.md")

def print_banner():
    os.system('cls' if os.name == 'nt' else 'clear')
    ip = get_ipv4()
    print(f"{Colors.BLUE}========================================================{Colors.ENDC}")
    print(f"{Colors.BOLD}      TmWork Launcher v2.0 (Premium Ed.){Colors.ENDC}")
    print(f"{Colors.BLUE}========================================================{Colors.ENDC}")
    print(f" {Colors.GREEN}IPv4 (Локальный):{Colors.ENDC} {Colors.BOLD}http://{ip}:3000{Colors.ENDC} (Frontend)")
    print(f" {Colors.GREEN}                  {Colors.ENDC} {Colors.BOLD}http://{ip}:8000{Colors.ENDC} (Backend API)")
    if os.path.exists(os.path.join(NGINX_DIR, "nginx.exe")):
        print(f" {Colors.GREEN}                  {Colors.ENDC} {Colors.BOLD}http://{ip}{Colors.ENDC}      (Nginx Gateway)")
    print(f"{Colors.BLUE}========================================================{Colors.ENDC}")

def run_process(command, cwd, title, mode="TERMINAL"):
    """
    Запускает процесс в зависимости от режима:
    mode="TERMINAL" -> Новое окно (Windows) или текущее
    mode="FILE" -> Перенаправление в файл логов
    mode="SILENT" -> Полная тишина (DEVNULL)
    """
    
    if mode == "TERMINAL":
        # Открываем в новом окне, чтобы видеть логи
        if sys.platform == "win32":
            # Используем /c, чтобы окно само закрывалось при остановке
            subprocess.Popen(f'start "{title}" cmd /c "{command}"', cwd=cwd, shell=True)
        else:
            # Linux/Mac
            import shutil
            bash_cmd = f"{command}"
            
            if shutil.which("x-terminal-emulator"):
                # Универсальный вариант для Kali/Ubuntu/Debian
                term_cmd = f"x-terminal-emulator -e \"bash -c '{bash_cmd}'\""
            elif shutil.which("gnome-terminal"):
                term_cmd = f"gnome-terminal -- bash -c \"{bash_cmd}\""
            elif shutil.which("qterminal"):
                term_cmd = f"qterminal -e \"bash -c '{bash_cmd}'\""
            elif shutil.which("xfce4-terminal"):
                term_cmd = f"xfce4-terminal -e \"bash -c '{bash_cmd}'\""
            elif sys.platform == "darwin": # Mac OS
                term_cmd = f"osascript -e 'tell app \"Terminal\" to do script \"cd {cwd} && {command}\"'"
            else:
                term_cmd = f"xterm -e \"bash -c '{bash_cmd}'\""
                
            subprocess.Popen(term_cmd, cwd=cwd, shell=True)
        return

    if mode == "FILE":
        log_file = get_log_file()
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n### [{timestamp}] Запуск {title}\nCommand: `{command}`\n\n")
        
        # Запускаем и перенаправляем вывод в тот же файл (в Append режиме)
        # В Windows сложно перенаправить в уже открытый файл питоном для Popen, поэтому используем shell redirect >>
        cmd = f'{command} >> "{log_file}" 2>&1'
        # stdin=subprocess.DEVNULL лечит краш Vite "Error: read EIO" в фоновом режиме
        subprocess.Popen(cmd, cwd=cwd, shell=True, stdin=subprocess.DEVNULL)
        return

    if mode == "SILENT":
        subprocess.Popen(command, cwd=cwd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return

def check_postgres():
    """Прострая проверка доступности порта 5432"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect(('localhost', 5432))
        s.close()
        return True
    except:
        return False

def start_postgres():
    print(f"{Colors.CYAN}[*] Попытка запуска PostgreSQL...{Colors.ENDC}")
    # Популярные имена служб PostgreSQL на Windows (начинаем с новых версий)
    services = ["postgresql-x64-18", "postgresql-18", "postgresql-x64-17", "postgresql-17", "postgresql-x64-16", "postgresql-16", "postgresql-x64-15", "postgresql-15", "postgresql"]
    started = False
    
    if sys.platform != "win32":
        print(f"{Colors.CYAN}[*] Запуск PostgreSQL на Linux через systemctl...{Colors.ENDC}")
        try:
            res = subprocess.run("sudo systemctl start postgresql", shell=True, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"{Colors.GREEN}[+] PostgreSQL успешно запущен!{Colors.ENDC}")
                time.sleep(3)
                return True
            else:
                print(f"{Colors.FAIL}[-] Не удалось запустить PostgreSQL. Ошибка: {res.stderr}{Colors.ENDC}")
                return False
        except Exception as e:
            print(f"{Colors.FAIL}[-] Ошибка при запуске: {str(e)}{Colors.ENDC}")
            return False

    for service in services:
        try:
            # net start возвращает 0 если запустилось, 2 если уже работает
            res = subprocess.run(f"net start {service}", shell=True, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"{Colors.GREEN}[+] Служба {service} успешно запущена!{Colors.ENDC}")
                started = True
                time.sleep(3) # Даем время на инициализацию
                break
            elif "The requested service has already been started" in res.stderr or res.returncode == 2:
                print(f"{Colors.GREEN}[+] Служба {service} уже активна.{Colors.ENDC}")
                started = True
                break
            elif "The service name is invalid" in res.stderr:
                continue # Пробуем следующее имя
        except Exception as e:
            # print(e)
            pass
    
    return started

# --- Основные сценарии ---

def start_dev(mode):
    print(f"\n{Colors.CYAN}[*] Запуск сервисов...{Colors.ENDC}")
    
    if mode == "FILE":
        # Убираем буферизацию вывода (стартовые сообщения Django появятся сразу)
        os.environ["PYTHONUNBUFFERED"] = "1"
        # Отключаем цвета (ANSI-коды), чтобы файл читался без "крякозябр"
        os.environ["NO_COLOR"] = "1"
        os.environ["FORCE_COLOR"] = "0"
        os.environ["DJANGO_COLORS"] = "nocolor"
        
    # 1. Проверка БД
    if not check_postgres():
        print(f"{Colors.WARNING}[!] PostgreSQL не обнаружен на порту 5432. Пробую запустить...{Colors.ENDC}")
        if start_postgres():
            if not check_postgres():
                print(f"{Colors.FAIL}[-] Служба запущена, но порт 5432 недоступен. Проверьте настройки.{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}[-] Не удалось найти или запустить службу PostgreSQL.{Colors.ENDC}")
            print("    Запустите вручную через 'services.msc' или просто 'net start postgresql-x64-15'")
            input("    Нажмите Enter, чтобы продолжить (без БД backend упадет)...")

    # 2. Backend
    print(f"{Colors.GREEN}[+] Запуск Backend (Django)...{Colors.ENDC}")
    run_process(f'"{VENV_PYTHON}" manage.py runserver 0.0.0.0:8000', BACKEND_DIR, "TM_BACKEND", mode)

    # 3. Frontend
    print(f"{Colors.GREEN}[+] Запуск Frontend (Vite)...{Colors.ENDC}")
    run_process('npm run dev', FRONTEND_DIR, "TM_FRONTEND", mode)

    # 4. Nginx (Если есть)
    nginx_exe = os.path.join(NGINX_DIR, "nginx.exe")
    if os.path.exists(nginx_exe):
        print(f"{Colors.GREEN}[+] Запуск Local Nginx...{Colors.ENDC}")
        # Nginx лучше запускать тихо или в окне, но он сразу отдает управление
        # Запускаем через start nginx
        subprocess.Popen('start nginx.exe', cwd=NGINX_DIR, shell=True)

    print(f"\n{Colors.BOLD}Готово! Сервисы запускаются.{Colors.ENDC}")
    if mode == "FILE":
        print(f"Логи пишутся в: {Colors.BLUE}{get_log_file()}{Colors.ENDC}")

def start_docker():
    print(f"\n{Colors.CYAN}[*] Запуск через Docker Compose...{Colors.ENDC}")
    os.system("docker-compose up --build") 
    # Docker занимает текущее окно, это нормально для мониторинга

def stop_all():
    print(f"\n{Colors.WARNING}[*] Остановка процессов...{Colors.ENDC}")
    if sys.platform == "win32":
        os.system("taskkill /F /IM node.exe /T >nul 2>&1")
        os.system("taskkill /F /IM nginx.exe /T >nul 2>&1")
        os.system('wmic process where "commandline like \'%manage.py runserver%\'" call terminate >nul 2>&1')
        print(f"{Colors.GREEN}[+] Все процессы убиты (Node, Django, Nginx).{Colors.ENDC}")
    else:
        # Убиваем только сервера, предотвращая `pkill python` от убийства самого run.py
        os.system("pkill -f 'manage.py runserver' >/dev/null 2>&1")
        os.system("pkill -f 'npm run dev' >/dev/null 2>&1")
        os.system("pkill -f 'vite' >/dev/null 2>&1")
        os.system("pkill node >/dev/null 2>&1")
        os.system("pkill nginx >/dev/null 2>&1")
        print(f"{Colors.GREEN}[+] Серверы проектов остановлены.{Colors.ENDC}")

def tools_menu():
    while True:
        print_banner()
        print(f"{Colors.HEADER}--- Инструменты ---{Colors.ENDC}")
        print(" [1] Выполнить миграции (migrate)")
        print(" [2] Создать суперпользователя (createsuperuser)")
        print(" [3] Установить зависимости (pip & npm)")
        print(" [0] Назад")
        
        choice = input(f"\n{Colors.BOLD}Ваш выбор: {Colors.ENDC}")
        
        if choice == "1":
            os.system(f'"{VENV_PYTHON}" manage.py migrate', cwd=BACKEND_DIR)
            input("\nНажмите Enter...")
        elif choice == "2":
            os.system(f'"{VENV_PYTHON}" manage.py createsuperuser', cwd=BACKEND_DIR)
            input("\nНажмите Enter...")
        elif choice == "3":
            print("Установка Python пакетов...")
            os.system('uv sync', cwd=BACKEND_DIR)
            print("Установка Node пакетов...")
            os.system('npm install', cwd=FRONTEND_DIR)
            input("\nГотово. Нажмите Enter...")
        elif choice == "0":
            break

def main():
    while True:
        print_banner()
        print(f"{Colors.HEADER}Выберите режим запуска:{Colors.ENDC}")
        print(f" [1] {Colors.CYAN}🚀 Разработка (Логи в терминале){Colors.ENDC} - Откроет новые окна")
        print(f" [2] {Colors.YELLOW}📄 Разработка (Логи в файл){Colors.ENDC}      - Тихо, пишет в logs/")
        print(f" [3] {Colors.MAGENTA}👻 Разработка (Без логов){Colors.ENDC}        - Максимальная тишина")
        print(f" [4] {Colors.BLUE}🐳 Docker Start{Colors.ENDC}                  - Полная эмуляция")
        print(" ---")
        print(f" [5] {Colors.FAIL}🛑 ОСТАНОВИТЬ ВСЁ{Colors.ENDC}                - Убить процессы")
        print(f" [6] {Colors.BOLD}🛠️  Инструменты{Colors.ENDC}                  - Миграции, Админ...")
        print(" [0] Выход")

        choice = input(f"\n{Colors.BOLD}Ваш выбор: {Colors.ENDC}")

        if choice == "1":
            start_dev("TERMINAL")
            break
        elif choice == "2":
            start_dev("FILE")
            break
        elif choice == "3":
            start_dev("SILENT")
            break
        elif choice == "4":
            start_docker()
            break
        elif choice == "5":
            stop_all()
            time.sleep(2)
        elif choice == "6":
            tools_menu()
        elif choice == "0":
            sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExit.")
