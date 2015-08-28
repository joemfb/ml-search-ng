(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"MLRemoteInputService.html\">MLRemoteInputService</a>","id":"MLRemoteInputService","children":[]},{"label":"<a href=\"MLRemoteSearchController.html\">MLRemoteSearchController</a>","id":"MLRemoteSearchController","children":[]},{"label":"<a href=\"MLSearchContext.html\">MLSearchContext</a>","id":"MLSearchContext","children":[]},{"label":"<a href=\"MLSearchController.html\">MLSearchController</a>","id":"MLSearchController","children":[]},{"label":"<a href=\"MLSearchFactory.html\">MLSearchFactory</a>","id":"MLSearchFactory","children":[]},{"label":"<a href=\"duration.html\">duration</a>","id":"duration","children":[]},{"label":"<a href=\"ml-chiclets.html\">ml-chiclets</a>","id":"ml-chiclets","children":[]},{"label":"<a href=\"ml-duration.html\">ml-duration</a>","id":"ml-duration","children":[]},{"label":"<a href=\"ml-facets.html\">ml-facets</a>","id":"ml-facets","children":[]},{"label":"<a href=\"ml-input.html\">ml-input</a>","id":"ml-input","children":[]},{"label":"<a href=\"ml-metrics.html\">ml-metrics</a>","id":"ml-metrics","children":[]},{"label":"<a href=\"ml-remote-input.html\">ml-remote-input</a>","id":"ml-remote-input","children":[]},{"label":"<a href=\"ml-results.html\">ml-results</a>","id":"ml-results","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
