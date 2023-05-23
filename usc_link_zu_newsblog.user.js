// ==UserScript==
// @name         Leitstellenspiel Erweiterung
// @namespace    http://tampermonkey.net/
// @version      1.2.4
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
        const newsLink = document.querySelector('#news_li a');
        if (!newsLink) return;

        const link = document.createElement('a');
        link.href = 'https://aao-update.nirolp.de/news';
        link.target = '_blank';
        link.textContent = 'AAO News';

        const listItem = document.createElement('li');
        listItem.role = 'presentation';
        listItem.appendChild(link);

        newsLink.parentNode.insertBefore(listItem, newsLink.nextSibling);
    }

    window.addEventListener('load', function() {
        checkScriptUpdates();
        addLinkToNavbar();
    });
})();
