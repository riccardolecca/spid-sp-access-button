/*

Versione vanilla JavaScript (senza jQuery) del file spid-sp-access-button.
Sostituisce la versione precedente che dipendeva da jQuery 1.8+.

Espone l'API globale window.spidIDPButton(element, action, param) per
l'uso programmatico.

*/

(function () {
    var dataStore = new WeakMap();

    function getData(el, key) {
        var store = dataStore.get(el);
        return store ? store[key] : undefined;
    }

    function setData(el, key, value) {
        var store = dataStore.get(el) || {};
        store[key] = value;
        dataStore.set(el, store);
    }

    function removeData(el, key) {
        var store = dataStore.get(el);
        if (store) delete store[key];
    }

    function isVisible(el) {
        return getComputedStyle(el).display !== 'none';
    }

    function outerWidth(el, includeMargins) {
        var width = el.offsetWidth;
        if (includeMargins) {
            var style = getComputedStyle(el);
            width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        }
        return width;
    }

    function outerHeight(el, includeMargins) {
        var height = el.offsetHeight;
        if (includeMargins) {
            var style = getComputedStyle(el);
            height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }
        return height;
    }

    // Mostra il popup al click (evt e' l'evento) oppure tramite chiamata
    // manuale (in questo caso evt e' NULL e triggerEl e' il bottone)
    function show(evt, triggerEl) {
        var objButton = triggerEl;
        var spidButton = document.querySelector(objButton.getAttribute('spid-idp-button'));
        var spidButtonIsOpen = objButton.classList.contains('spid-idp-button-open');

        if (evt) {
            if (evt.target.classList.contains('spid-idp-button-ignore')) return;
            evt.preventDefault();
            evt.stopPropagation();
        }

        hide();

        if (!spidButtonIsOpen && !objButton.classList.contains('spid-idp-button-disabled')) {
            objButton.classList.add('spid-idp-button-open');
            setData(spidButton, 'spid-idp-button-trigger', objButton);
            spidButton.style.display = 'block';
            redraw();
            spidButton.dispatchEvent(new CustomEvent('show', {
                detail: { spidIDPButton: spidButton, trigger: objButton }
            }));
        }
    }

    // Nasconde il popup
    function hide(evt) {
        if (evt) {
            var el = evt.target;
            var inSpidButton = false;
            var inMenu = false;
            var isAnchor = false;

            while (el) {
                if (el.classList) {
                    if (el.classList.contains('spid-idp-button')) inSpidButton = true;
                    if (el.classList.contains('spid-idp-button-menu')) inMenu = true;
                }
                if (el.tagName === 'A') isAnchor = true;
                el = el.parentElement;
            }

            if (inSpidButton) {
                if (!inMenu) return;
                if (!isAnchor) return;
            }
        }

        document.querySelectorAll('.spid-idp-button').forEach(function (spidButton) {
            if (isVisible(spidButton)) {
                spidButton.style.display = 'none';
                removeData(spidButton, 'spid-idp-button-trigger');
                spidButton.dispatchEvent(new CustomEvent('hide', {
                    detail: { spidIDPButton: spidButton }
                }));
            }
        });

        document.querySelectorAll('.spid-idp-button-open').forEach(function (el) {
            el.classList.remove('spid-idp-button-open');
        });
    }

    // Ridisegna il CSS del popup adattandolo
    function redraw() {
        var visibleButtons = Array.from(document.querySelectorAll('.spid-idp-button')).filter(isVisible);
        var spidButton = visibleButtons[0];
        if (!spidButton) return;

        var spidTrigger = getData(spidButton, 'spid-idp-button-trigger');
        if (!spidTrigger) return;

        var xoffset = parseInt(spidTrigger.getAttribute('data-horizontal-offset') || 0, 10);
        var yoffset = parseInt(spidTrigger.getAttribute('data-vertical-offset') || 0, 10);

        if (spidButton.classList.contains('spid-idp-button-relative')) {
            var triggerStyle = getComputedStyle(spidTrigger);
            if (spidButton.classList.contains('spid-idp-button-anchor-right')) {
                spidButton.style.left = (spidTrigger.offsetLeft - (outerWidth(spidButton, true) - outerWidth(spidTrigger, true)) - parseFloat(triggerStyle.marginRight) + xoffset) + 'px';
            } else {
                spidButton.style.left = (spidTrigger.offsetLeft + parseFloat(triggerStyle.marginLeft) + xoffset) + 'px';
            }
            spidButton.style.top = (spidTrigger.offsetTop + outerHeight(spidTrigger, true) - parseFloat(triggerStyle.marginTop) + yoffset) + 'px';
        } else {
            var rect = spidTrigger.getBoundingClientRect();
            var offsetLeft = rect.left + window.scrollX;
            var offsetTop = rect.top + window.scrollY;

            if (spidButton.classList.contains('spid-idp-button-anchor-right')) {
                spidButton.style.left = (offsetLeft - (outerWidth(spidButton) - outerWidth(spidTrigger)) + xoffset) + 'px';
            } else {
                spidButton.style.left = (offsetLeft + xoffset) + 'px';
            }
            spidButton.style.top = (offsetTop + outerHeight(spidTrigger) + yoffset) + 'px';
        }
    }

    // API pubblica
    window.spidIDPButton = function (el, action, param) {
        switch (action) {
        case 'show':
            show(null, el);
            return el;
        case 'hide':
            hide();
            return el;
        case 'attach':
            el.setAttribute('spid-idp-button', param);
            return el;
        case 'detach':
            hide();
            el.removeAttribute('spid-idp-button');
            return el;
        case 'disable':
            el.classList.add('spid-idp-button-disabled');
            return el;
        case 'enable':
            hide();
            el.classList.remove('spid-idp-button-disabled');
            return el;
        }
    };

    // Event delegation per i click
    document.addEventListener('click', function (evt) {
        var trigger = evt.target.closest('[spid-idp-button]');
        if (trigger) {
            show(evt, trigger);
        } else {
            hide(evt);
        }
    });

    window.addEventListener('resize', redraw);
})();
