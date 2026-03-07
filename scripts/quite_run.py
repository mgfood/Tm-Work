import subprocess
import os
import time
import socket
import signal

def get_ipv4():
    """Получает локальный IPv4 адрес устройства."""
    try:
        # Создаем временный сокет для определения IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    nginx_dir = os.path.join(root_dir, "nginx")

    venv_python = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python"

    local_ip = get_ipv4()
    processes = []

    # Флаг для запуска без окна консоли (только для Windows)
    CREATE_NO_WINDOW = 0x08000000

    print("="*60)
    print(f" Локальный IPv4: {local_ip}")
    print("="*60)
    print("[*] Запуск сервисов в фоновом режиме...")

    try:
        # 1. Backend
        backend_proc = subprocess.Popen(
            [venv_python, "manage.py", "runserver", "0.0.0.0:8000"],
            cwd=backend_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=CREATE_NO_WINDOW
        )
        processes.append(("Backend", backend_proc))

        # 2. Frontend
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd=frontend_dir,
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=CREATE_NO_WINDOW
        )
        processes.append(("Frontend", frontend_proc))

        # 3. Nginx
        nginx_proc = subprocess.Popen(
            ["nginx/nginx.exe"],
            cwd=nginx_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=CREATE_NO_WINDOW
        )
        processes.append(("Nginx", nginx_proc))

        print("\n [!] ВСЕ СИСТЕМЫ ЗАПУЩЕНЫ (БЕЗ ЛОГОВ)")
        print(f" Frontend: http://localhost:3000 (или http://{local_ip}:3000)")
        print(f" Nginx:    http://{local_ip}")
        print(f" Backend:  http://{local_ip}:8000")
        print("\n Нажмите Ctrl+C в этом окне, чтобы остановить всё.")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n[*] Остановка всех процессов...")
        
        # Специальная остановка для Nginx
        subprocess.run("nginx/nginx.exe -s stop", cwd=nginx_dir, shell=True, capture_output=True)
        
        # Убиваем остальные процессы
        for name, proc in processes:
            print(f"[*] Завершение {name}...")
            proc.terminate() # Мягкая остановка
            # Если не помогло, можно использовать taskkill через пару секунд
        
        print("[+] Все системы остановлены.")

if __name__ == "__main__":
    main()