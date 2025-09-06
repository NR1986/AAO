// ==UserScript==
// @name         [LSS] Fahrzeuge auflistung innerhalb der AAO Neueintragung
// @namespace    https://leitstellenspiel.de/
// @version      1.1
// @description  Exportiert alle Fahrzeuge aus allen Tabs auf der AAO-New-Seite als JSON-Datei
// @author       NinoRossi
// @match        https://www.leitstellenspiel.de/aaos/new
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Button einfügen
    const btn = document.createElement("button");
    btn.textContent = "🚒 Fahrzeuge als JSON exportieren";
    btn.style.position = "fixed";
    btn.style.top = "10px";
    btn.style.right = "10px";
    btn.style.zIndex = "9999";
    btn.style.padding = "8px 12px";
    btn.style.background = "#007bff";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";

    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
        let fahrzeuge = [];

        // Alle Tabs durchsuchen
        document.querySelectorAll(".tab-pane").forEach(tab => {
            const kategorie = tab.id; // z.B. fire, rescue, police

            tab.querySelectorAll(".form-group").forEach(group => {
                const label = group.querySelector("label");
                const input = group.querySelector("input");

                if (label && input) {
                    fahrzeuge.push({
                        kategorie: kategorie,
                        name: label.textContent.trim(),
                        id: input.id,
                        inputName: input.name
                    });
                }
            });
        });

        // JSON erzeugen
        const jsonStr = JSON.stringify(fahrzeuge, null, 2);

        // Datei herunterladen
        const blob = new Blob([jsonStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fahrzeuge.json";
        a.click();
        URL.revokeObjectURL(url);
    });
})();
