// ==UserScript==
// @name         Leitstellenspiel Erweiterung
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Erweiterungen für das Leitstellenspiel
// @author       NiRoLP
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function checkScriptUpdates() {
        const scriptUrl = 'https://raw.githubusercontent.com/NR1986/AAO/usc_link_zu_newsblog.user.js';
        const currentVersion = GM_info.script.version;

        GM_xmlhttpRequest({
            method: 'GET',
            url: scriptUrl,
            onload: function(response) {
                const scriptCode = response.responseText;
                const match = scriptCode.match(/@version\s+([0-9.]+)/);

                if (match && match[1] !== currentVersion) {
                    alert('Es ist eine neue Version des Userscripts verfügbar!');
                }
            }
        });
    }

    function addLinkToNavbar() {
        const navbar = document.getElementById('navbar');
        const newsLi = navbar.querySelector('#news_li');

        const link = document.createElement('a');
        link.href = 'https://aao-update.nirolp.de/news';
        link.target = '_blank';
        link.textContent = 'AAO News';

        newsLi.appendChild(link);
    }

    window.addEventListener('load', function() {
        checkScriptUpdates();
        addLinkToNavbar();
    });
})();
