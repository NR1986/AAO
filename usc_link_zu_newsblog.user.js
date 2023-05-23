// ==UserScript==
// @name         Leitstellenspiel Erweiterung
// @namespace    http://tampermonkey.net/
// @version      1.2.8
// @description  Erweiterungen für das Leitstellenspiel
// @author       NiRoLP
// @match        https://www.leitstellenspiel.de/*
// @run-at       document-idle
// @grant        GM_info
// @grant        unsafeWindow
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
        const navbarRight = document.querySelector('.nav.navbar-nav.navbar-right');
        if (!navbarRight) return;

        const link = document.createElement('a');
        link.href = 'https://aao-update.nirolp.de/news';
        link.className = 'btn btn-default navbar-btn';
        link.textContent = 'AAO News';

        const listItem = document.createElement('li');
        listItem.appendChild(link);

        navbarRight.appendChild(listItem);
    }

    window.addEventListener('load', function() {
        checkScriptUpdates();
        addLinkToNavbar();
    });
})();
