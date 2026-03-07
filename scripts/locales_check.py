import json
import os

def get_keys(data, prefix=""):
    """Рекурсивно собирает все ключи из вложенного словаря."""
    keys = {}
    for k, v in data.items():
        new_prefix = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_keys(v, new_prefix))
        else:
            keys[new_prefix] = v
    return keys

def set_nested_key(data, key_path, value):
    """Устанавливает значение в глубоко вложенный словарь по пути 'a.b.c'."""
    keys = key_path.split('.')
    for key in keys[:-1]:
        data = data.setdefault(key, {})
    data[keys[-1]] = value

def sort_dict(d):
    """Рекурсивно сортирует словарь по ключам."""
    return {k: sort_dict(v) if isinstance(v, dict) else v for k, v in sorted(d.items())}

def main():
    # Пути к файлам (относительно корня проекта)
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ru_path = os.path.join(root_dir, 'frontend', 'src', 'locales', 'ru.json')
    tk_path = os.path.join(root_dir, 'frontend', 'src', 'locales', 'tk.json')

    if not os.path.exists(ru_path) or not os.path.exists(tk_path):
        print(f"Ошибка: Не найдены файлы по адресу:\n{ru_path}\n{tk_path}")
        return

    with open(ru_path, 'r', encoding='utf-8') as f:
        ru_data = json.load(f)
    with open(tk_path, 'r', encoding='utf-8') as f:
        tk_data = json.load(f)

    ru_keys = get_keys(ru_data)
    tk_keys = get_keys(tk_data)

    ru_set = set(ru_keys.keys())
    tk_set = set(tk_keys.keys())

    missing_in_tk = ru_set - tk_set
    missing_in_ru = tk_set - ru_set

    print("="*50)
    print(f"Анализ файлов локализации")
    print("="*50)
    print(f"RU ключей: {len(ru_set)}")
    print(f"TK ключей: {len(tk_set)}")
    print("-" * 50)

    if not missing_in_tk and not missing_in_ru:
        print("[+] Файлы полностью синхронизированы!")
    else:
        if missing_in_tk:
            print(f"[!] Отсутствуют в tk.json ({len(missing_in_tk)}):")
            for k in sorted(missing_in_tk):
                print(f"  - {k}")
        
        if missing_in_ru:
            print(f"\n[!] Отсутствуют в ru.json ({len(missing_in_ru)}):")
            for k in sorted(missing_in_ru):
                print(f"  - {k}")
        
        print("\n" + "="*50)
        answer = input("Хотите ли вы автоматически добавить недостающие ключи и отсортировать файлы? (y/n): ")
        if answer.lower() == 'y':
            # Добавляем в TK то, что есть в RU
            for key in missing_in_tk:
                set_nested_key(tk_data, key, f"[TODO: {key}]")
            
            # Добавляем в RU то, что есть в TK
            for key in missing_in_ru:
                set_nested_key(ru_data, key, f"[TODO: {key}]")

            # Сортируем
            ru_data_sorted = sort_dict(ru_data)
            tk_data_sorted = sort_dict(tk_data)

            # Сохраняем
            with open(ru_path, 'w', encoding='utf-8') as f:
                json.dump(ru_data_sorted, f, ensure_ascii=False, indent=2)
            with open(tk_path, 'w', encoding='utf-8') as f:
                json.dump(tk_data_sorted, f, ensure_ascii=False, indent=2)
            
            print("[+] Файлы обновлены, ключи добавлены с пометкой [TODO], словари отсортированы.")

if __name__ == "__main__":
    main()
