// ==UserScript==
// @name         Leitstellenspiel Erweiterung
// @namespace    http://tampermonkey.net/
// @version      1.2.6
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
        const navbarRight = document.querySelector('.navbar-nav.navbar-right');
        if (!navbarRight) return;

        const dropdownMenu = document.createElement('ul');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.role = 'menu';
        dropdownMenu.setAttribute('aria-labelledby', 'news');

        const link1 = document.createElement('a');
        link1.href = 'https://www.facebook.com/Leitstellenspiel.de/';
        link1.className = 'mixed-mobile-desktop-external-link';
        link1.id = 'newspage_facebook';
        link1.target = '_blank';
        link1.textContent = 'Facebook Newspage';

        const link2 = document.createElement('a');
        link2.href = 'https://blog.leitstellenspiel.de/blog/';
        link2.className = 'lightbox-open mixed-mobile-desktop-external-link';
        link2.textContent = 'Leitstellenspiel Newspage';

        const listItem1 = document.createElement('li');
        listItem1.role = 'presentation';
        listItem1.appendChild(link1);

        const listItem2 = document.createElement('li');
        listItem2.role = 'presentation';
        listItem2.appendChild(link2);

        dropdownMenu.appendChild(listItem1);
        dropdownMenu.appendChild(listItem2);

        const dropdown = document.createElement('li');
        dropdown.className = 'dropdown';
        dropdown.id = 'news_li';

        const link = document.createElement('a');
        link.href = '#';
        link.id = 'news';
        link.role = 'button';
        link.className = 'dropdown-toggle mixed-mobile-desktop-external-link';
        link.setAttribute('data-toggle', 'dropdown');

        const img = document.createElement('img');
        img.alt = 'Google_news_ffffff';
        img.className = 'navbar-icon';
        img.src = '/images/google_news_ffffff.svg';
        img.title = 'News';

        const span = document.createElement('span');
        span.className = 'visible-xs';
        span.textContent = 'News';

        const caret = document.createElement('b');
        caret.className = 'caret';

        link.appendChild(img);
        link.appendChild(span);
        link.appendChild(caret);

        dropdown.appendChild(link);
        dropdown.appendChild(dropdownMenu);

        navbarRight.appendChild(dropdown);
    }

    window.addEventListener('load', function() {
        checkScriptUpdates();
        addLinkToNavbar();
    });
})();
