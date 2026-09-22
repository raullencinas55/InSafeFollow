"""
test_e2e.py - Suite de Pruebas de Integracion y E2E (ISO/IEC 25010)
Verifica que las paginas index.html y app.html carguen sin errores,
respeten la politica CSP, carguen los modulos desacoplados y respondan en movil.
"""

import sys
import os
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_e2e():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_url = "file:///" + os.path.join(base_dir, "index.html").replace("\\", "/")
    app_url = "file:///" + os.path.join(base_dir, "app.html").replace("\\", "/")

    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(375, 812) # Emular iPhone SE / movil estandar

    print("\n--- INICIANDO PRUEBAS E2E (SELENIUM HEADLESS) ---")

    try:
        # TEST 1: index.html
        print("[TEST 1] Verificando index.html...")
        driver.get(index_url)
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "landingDropzone")))

        # Comprobar meta CSP
        csp_meta = driver.find_elements(By.XPATH, "//meta[@http-equiv='Content-Security-Policy']")
        assert len(csp_meta) > 0, "Falta la etiqueta meta Content-Security-Policy en index.html"
        csp_content = csp_meta[0].get_attribute("content")
        assert "connect-src 'none'" in csp_content, "connect-src 'none' ausente en CSP de index.html"
        print("  [OK] index.html cargado con CSP estricto (connect-src 'none')")

        # Comprobar logs de consola
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l["level"] == "SEVERE"]
        assert len(severe_errors) == 0, f"Errores en consola en index.html: {severe_errors}"
        print("  [OK] Cero errores SEVERE en consola de index.html")

        # TEST 2: app.html carga base
        print("[TEST 2] Verificando app.html y carga de modulos desacoplados...")
        driver.get(app_url)
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "dropzone")))

        # Comprobar meta CSP en app.html
        app_csp = driver.find_elements(By.XPATH, "//meta[@http-equiv='Content-Security-Policy']")
        assert len(app_csp) > 0, "Falta la etiqueta meta Content-Security-Policy en app.html"
        assert "connect-src 'none'" in app_csp[0].get_attribute("content"), "connect-src 'none' ausente en app.html"
        print("  [OK] app.html cargado con CSP estricto")

        # Verificar presencia de modulos globales desacoplados
        has_chart = driver.execute_script("return typeof window.InSafeFollowChart === 'object' && typeof window.InSafeFollowChart.render === 'function';")
        has_gestures = driver.execute_script("return typeof window.InSafeFollowGestures === 'object' && typeof window.InSafeFollowGestures.bindSwipe === 'function';")
        has_storage = driver.execute_script("return typeof window.InSafeFollowStorage === 'object';")
        has_parser = driver.execute_script("return typeof window.InstagramParser === 'object';")

        assert has_chart, "Modulo InSafeFollowChart no disponible globalmente"
        assert has_gestures, "Modulo InSafeFollowGestures no disponible globalmente"
        assert has_storage, "Modulo InSafeFollowStorage no disponible globalmente"
        assert has_parser, "Modulo InstagramParser no disponible globalmente"
        print("  [OK] Todos los modulos desacoplados (Chart, Gestures, Storage, Parser) estan activos")

        # TEST 3: Inyeccion de datos y simulacion de dashboard activo en movil (375px)
        print("[TEST 3] Simulando dashboard activo con datos e interaccion en movil (375px)...")
        dummy_snapshot = {
            "accountOwner": "test_e2e_user",
            "parsedAt": "2026-09-21T20:00:00.000Z",
            "following": [
                {"username": "unfollower1", "name": "User One", "timestamp": 1672531199000},
                {"username": "unfollower2", "name": "User Two", "timestamp": 1675209599000},
                {"username": "mutual_friend", "name": "Mutual Friend", "timestamp": 1677628799000}
            ],
            "followers": [
                {"username": "mutual_friend", "name": "Mutual Friend", "timestamp": 1677628799000},
                {"username": "loyal_fan", "name": "Loyal Fan", "timestamp": 1680307199000}
            ],
            "pendingRequests": [],
            "recentlyUnfollowed": [],
            "blockedProfiles": [],
            "hideStoryFrom": [],
            "receivedRequests": [],
            "followingHashtags": [],
            "closeFriends": [],
            "restrictedProfiles": []
        }

        # Inyectar snapshot en localStorage y recargar app
        driver.execute_script(f"localStorage.setItem('insafefollow_current_snapshot', JSON.stringify({json.dumps(dummy_snapshot)}));")
        driver.get(app_url)

        # Esperar que el dashboard aparezca
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "dashboardContent")))
        dashboard_display = driver.find_element(By.ID, "dashboardContent").value_of_css_property("display")
        assert dashboard_display != "none", "El dashboard no se mostro tras inyectar datos en localStorage"
        print("  [OK] Dashboard activo renderizado con exito tras inyeccion de snapshot")

        # Comprobar grafico desplegable
        toggle_chart_btn = driver.find_element(By.ID, "toggleChartBtn")
        toggle_chart_btn.click()
        chart_container = driver.find_element(By.ID, "growthChartContainer")
        assert chart_container.value_of_css_property("display") != "none", "El contenedor del grafico no se desplego"
        
        # Comprobar que el SVG se renderizo dentro del contenedor
        svg_bars = driver.find_elements(By.CSS_SELECTOR, "#chartSvgWrap rect.chart-bar")
        assert len(svg_bars) > 0, "No se generaron barras SVG en el grafico desacoplado"
        print(f"  [OK] Grafico SVG interactivo generado correctamente ({len(svg_bars)} barras renderizadas)")

        # Comprobar logs finales en app.html
        app_logs = driver.get_log("browser")
        app_severe = [l for l in app_logs if l["level"] == "SEVERE"]
        assert len(app_severe) == 0, f"Errores en consola en app.html: {app_severe}"
        print("  [OK] Cero errores SEVERE en consola durante flujo completo")

        print("\n--- TODAS LAS PRUEBAS E2E PASARON EXITOSAMENTE (100%) ---\n")
        return True

    except Exception as e:
        print(f"\n[ERROR] en pruebas E2E: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    success = run_e2e()
    sys.exit(0 if success else 1)
