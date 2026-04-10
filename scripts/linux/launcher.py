#!/usr/bin/env python3
import os
import sys
import time
import socket
import subprocess
import signal
from pathlib import Path

# --- Configuration ---
SCRIPTS_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPTS_DIR.parent.parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
LOGS_DIR = ROOT_DIR / "logs"

# Ensure logs dir exists
LOGS_DIR.mkdir(exist_ok=True)

# Python interpreter from venv
VENV_PYTHON = BACKEND_DIR / ".venv" / "bin" / "python"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

# Colors & Terminal Controls
class C:
    H = '\033[95m'  # Title
    B = '\033[94m'  # Blue
    CY = '\033[96m' # Cyan
    G = '\033[92m'  # Green
    Y = '\033[93m'  # Yellow
    R = '\033[91m'  # Red
    E = '\033[0m'   # End
    BOLD = '\033[1m'
    
    # Screen matching "Application Mode"
    ENTER_ALT = "\033[?1049h"
    EXIT_ALT = "\033[?1049l"
    HIDE_CURSOR = "\033[?25l"
    SHOW_CURSOR = "\033[?25h"
    CLEAR = "\033[H\033[2J"

# State management
running_processes = []
active_mode = "NONE"

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
    print(f"{C.B}║{C.E} 🚀 {C.BOLD}{C.H}        TmWork Control Center (LINUX v4.0){C.E}        {C.B}║{C.E}")
    print(f"{C.B}╠════════════════════════════════════════════════════════╣{C.E}")
    print(f"{C.B}║{C.E} 🌐 {C.G}Web Access:{C.E} {C.BOLD}http://{ip}:3000{C.E}                   {C.B}║{C.E}")
    print(f"{C.B}║{C.E} 🔗 {C.G}API Root:  {C.E} {C.BOLD}http://{ip}:8000{C.E}                   {C.B}║{C.E}")
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
    print(f"\n{C.CY}🐘 [PROMPT] PostgreSQL is offline.{C.E}")
    choice = input(f"{C.Y}[?] Start locally via systemctl? (y/n): {C.E}").lower()
    if choice == 'y':
        print(f"{C.CY}[*] Running 'sudo systemctl start postgresql'...{C.E}")
        subprocess.run("sudo systemctl start postgresql", shell=True)
        time.sleep(1)

def kill_processes():
    global active_mode
    if not running_processes:
        return
    
    print(f"\n{C.Y}🛑 Stopping all active services...{C.E}")
    for name, proc in running_processes:
        try:
            print(f"    - Terminating {name} (PID: {proc.pid})")
            proc.terminate()
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()
        except:
            pass
    
    # Extra cleanup
    subprocess.run("pkill -f 'manage.py runserver' >/dev/null 2>&1", shell=True)
    subprocess.run("pkill -f 'vite' >/dev/null 2>&1", shell=True)
    
    running_processes.clear()
    active_mode = "NONE"
    print(f"{C.G}✅ All services stopped.{C.E}")

def launch_services(mode):
    global active_mode
    if running_processes:
        print(f"{C.R}⚠️ Services are already running!{C.E}")
        time.sleep(1)
        return

    if not check_postgres():
        start_postgres()

    print(f"\n{C.CY}🛠 Launching in {C.BOLD}{mode.upper()}{C.E}{C.CY} mode...{C.E}")
    
    try:
        be_cmd = [str(VENV_PYTHON), "manage.py", "runserver", "0.0.0.0:8000"]
        fe_cmd = "npm run dev"

        if mode == "silent":
            be_proc = subprocess.Popen(be_cmd, cwd=BACKEND_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            fe_proc = subprocess.Popen(fe_cmd, cwd=FRONTEND_DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            active_mode = "SILENT"

        elif mode == "window":
            # Multi-window mode (using x-terminal-emulator)
            be_win_cmd = f'x-terminal-emulator -T "BACKEND LOGS" -e "bash -c \'{VENV_PYTHON} manage.py runserver 0.0.0.0:8000; exec bash\'"'
            fe_win_cmd = f'x-terminal-emulator -T "FRONTEND LOGS" -e "bash -c \'npm run dev; exec bash\'"'
            
            # For windows mode we just launch them, but Popen will track the terminal session if it stays active
            # Actually, we should track the internal processes, but opening new terminals detaches them often.
            # We'll just launch and rely on pkill for cleanup.
            subprocess.Popen(be_win_cmd, shell=True, cwd=BACKEND_DIR)
            subprocess.Popen(fe_win_cmd, shell=True, cwd=FRONTEND_DIR)
            
            # We use dummy procs to mark that we are "running"
            be_proc = subprocess.Popen(["sleep", "1000000"], stdout=subprocess.DEVNULL)
            fe_proc = subprocess.Popen(["sleep", "1000000"], stdout=subprocess.DEVNULL)
            active_mode = "WINDOWS"

        elif mode == "file":
            be_log = open(LOGS_DIR / "backend.log", "a")
            fe_log = open(LOGS_DIR / "frontend.log", "a")
            be_proc = subprocess.Popen(be_cmd, cwd=BACKEND_DIR, stdout=be_log, stderr=be_log)
            fe_proc = subprocess.Popen(fe_cmd, cwd=FRONTEND_DIR, shell=True, stdout=fe_log, stderr=fe_log)
            active_mode = f"LOGS ({LOGS_DIR.name}/)"

        running_processes.append(("Backend", be_proc))
        running_processes.append(("Frontend", fe_proc))
        
        print(f"{C.G}✅ Services launched!{C.E}")
        time.sleep(1.5)
    except Exception as e:
        print(f"{C.R}❌ Error: {e}{C.E}")
        kill_processes()
        input("\nPress Enter to continue...")

def db_reset_menu():
    print(f"\n{C.CY}🧹 --- DATABASE RESET ---{C.E}")
    print(f" {C.BOLD}[1]{C.E} SQLite (Delete db.sqlite3)")
    print(f" {C.BOLD}[2]{C.E} PostgreSQL (Drop Public Schema)")
    print(f" {C.BOLD}[0]{C.E} Cancel")
    
    sys.stdout.write(C.SHOW_CURSOR)
    sys.stdout.flush()
    db_choice = input(f"\n{C.BOLD}Choice > {C.E}").strip()
    sys.stdout.write(C.HIDE_CURSOR)
    sys.stdout.flush()
    
    if db_choice == '1':
        run_tool("Clear SQLite", "🧹", f'"{VENV_PYTHON}" {ROOT_DIR}/scripts/db_clear.py --sqlite', BACKEND_DIR)
    elif db_choice == '2':
        run_tool("Clear Postgres", "🧹", f'"{VENV_PYTHON}" {ROOT_DIR}/scripts/db_clear.py --postgres', BACKEND_DIR)
    else:
        print(f"{C.Y}[!] Reset cancelled.{C.E}")
        time.sleep(0.5)

def run_tool(name, icon, command, cwd):
    print(f"\n{C.CY}{icon} Running: {C.BOLD}{name}{C.E}...{C.E}")
    try:
        subprocess.run(command, cwd=cwd, shell=True)
    except Exception as e:
        print(f"{C.R}❌ Error: {e}{C.E}")
    input("\nTask finished. Press Enter to return...")

def signal_handler(sig, frame):
    kill_processes()
    sys.stdout.write(C.SHOW_CURSOR + C.EXIT_ALT)
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, signal_handler)
    sys.stdout.write(C.ENTER_ALT + C.HIDE_CURSOR)
    sys.stdout.flush()
    
    try:
        while True:
            print_header()
            
            pg_status = f"{C.G}ONLINE{C.E}" if check_postgres() else f"{C.R}OFFLINE{C.E}"
            sv_status = f"{C.G}RUNNING{C.E}" if running_processes else f"{C.Y}STOPPED{C.E}"
            
            print(f" 📡 {C.BOLD}STATUS:{C.E} Postgres: {pg_status} | Services: {sv_status} [{C.CY}{active_mode}{C.E}]")
            print(f"{C.B}──────────────────────────────────────────────────────────{C.E}")
            print(f" {C.BOLD}[1]{C.E} 🚀 {C.G}SILENT START{C.E} (Background, no logs)")
            print(f" {C.BOLD}[2]{C.E} 🪟 WINDOW START{C.E} (Open 2 terminal logs)")
            print(f" {C.BOLD}[3]{C.E} 📝 FILE LOG START{C.E} (Save to logs/*.log)")
            print(f" {C.BOLD}[X]{C.E} 🛑 STOP ALL SERVICES")
            print(f"{C.B}──────────────────── {C.BOLD}Development Tools{C.E} ───────────────────{C.E}")
            print(f" {C.BOLD}[4]{C.E} 🏗️  Run Migrations")
            print(f" {C.BOLD}[5]{C.E} 🔑 Create Superuser")
            print(f" {C.BOLD}[6]{C.E} 🧹 Clear & Reset DB (Interactive)")
            print(f" {C.BOLD}[7]{C.E} 🌍 Check Locales")
            print(f" {C.BOLD}[8]{C.E} 📦 Install Dependencies")
            print(f"{C.B}──────────────────────────────────────────────────────────{C.E}")
            print(f" {C.BOLD}[0]{C.E} 🚪 EXIT")
            
            sys.stdout.write(C.SHOW_CURSOR)
            sys.stdout.flush()
            choice = input(f"\n{C.BOLD}Cmd > {C.E}").strip().upper()
            sys.stdout.write(C.HIDE_CURSOR)
            sys.stdout.flush()
            
            if choice == '1': launch_services("silent")
            elif choice == '2': launch_services("window")
            elif choice == '3': launch_services("file")
            elif choice == 'X' or choice == 'Х': 
                kill_processes()
                time.sleep(1)
            elif choice == '4': run_tool("Migrate", "🏗️", f'"{VENV_PYTHON}" manage.py migrate', BACKEND_DIR)
            elif choice == '5': run_tool("Admin", "🔑", f'"{VENV_PYTHON}" manage.py createsuperuser', BACKEND_DIR)
            elif choice == '6':
                db_reset_menu()
            elif choice == '7': run_tool("Locales", "🌍", f'"{VENV_PYTHON}" {ROOT_DIR}/scripts/locales_check.py', BACKEND_DIR)
            elif choice == '8':
                print(f"\n{C.CY}📦 Downloading dependencies...{C.E}")
                subprocess.run("uv sync", cwd=BACKEND_DIR, shell=True)
                subprocess.run("npm install", cwd=FRONTEND_DIR, shell=True)
                input("\nDone. Press Enter...")
            elif choice == '0' or choice == "EXIT":
                kill_processes()
                break
            else:
                print(f"{C.R}❌ Invalid option.{C.E}")
                time.sleep(0.5)
    finally:
        sys.stdout.write(C.SHOW_CURSOR + C.EXIT_ALT)
        sys.stdout.flush()

if __name__ == "__main__":
    main()
