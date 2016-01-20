/**
 * CoreShop
 *
 * LICENSE
 *
 * This source file is subject to the GNU General Public License version 3 (GPLv3)
 * For the full copyright and license information, please view the LICENSE.md and gpl-3.0.txt
 * files that are distributed with this source code.
 *
 * @copyright  Copyright (c) 2015 Dominik Pfaffenbauer (http://dominik.pfaffenbauer.at)
 * @license    http://www.coreshop.org/license     GNU General Public License version 3 (GPLv3)
 */

pimcore.registerNS("pimcore.plugin.coreshop");

pimcore.plugin.coreshop = Class.create(pimcore.plugin.admin,{


    isInitialized : false,
    settings : {},

    getClassName: function (){
        return "pimcore.plugin.coreshop";
    },

    initialize: function() {
        pimcore.plugin.broker.registerPlugin(this);
    },

    uninstall: function(){
        //TODO remove from menu
    },

    pimcoreReady: function (params, broker) {
        var self = this;
        var coreShopMenuItems = [];
        var statusbar = pimcore.globalmanager.get("statusbar");
        var toolbar = pimcore.globalmanager.get("layout_toolbar");
        var coreShopStatusItem = statusbar.insert(0, '<em class="fa fa-spinner"></em> ' + t("coreshop_loading"));
        statusbar.insert(1, "-");

        pimcore.globalmanager.add("coreshop_statusbar_item", coreShopStatusItem);

        pimcore.plugin.coreshop.broker.addListener("storesLoaded", function() {
            this.isInitialized = true;

            coreShopStatusItem.setHtml('<em class="fa fa-shopping-cart"></em> ' + t("coreshop_loaded").format(this.settings.plugin.pluginVersion))
        }, this);

        Ext.Ajax.request({
            url: "/plugin/CoreShop/admin_settings/get-settings",
            success: function (response)
            {
                var resp = Ext.decode(response.responseText);
                var user = pimcore.globalmanager.get("user");

                this.settings = resp;

                if(intval(this.settings.coreshop.isInstalled)) {

                    if(user.isAllowed("coreshop_permission_settings")) {
                        coreShopMenuItems.push({
                            text: t("coreshop_settings"),
                            iconCls: "coreshop_icon_settings",
                            handler: this.openSettings
                        });
                    }

                    if(user.isAllowed("coreshop_permission_priceRules")) {
                        coreShopMenuItems.push({
                            text: t("coreshop_price_rules"),
                            iconCls: "coreshop_icon_price_rule",
                            handler: this.openPriceRules
                        });
                    }

                    var localizationMenu = [];

                    if(user.isAllowed("coreshop_permission_countries")) {
                        localizationMenu.push({
                            text: t("coreshop_countries"),
                            iconCls: "coreshop_icon_country",
                            handler: this.openCountryList
                        });
                    }

                    if(user.isAllowed("coreshop_permission_currencies")) {
                        localizationMenu.push({
                            text: t("coreshop_currencies"),
                            iconCls: "coreshop_icon_currency",
                            handler: this.openCurrencyList
                        });
                    }

                    if(user.isAllowed("coreshop_permission_zones")) {
                        localizationMenu.push({
                            text: t("coreshop_zones"),
                            iconCls: "coreshop_icon_zone",
                            handler: this.openZoneList
                        });
                    }

                    if(user.isAllowed("coreshop_permission_taxes")) {
                        localizationMenu.push({
                            text: t("coreshop_taxes"),
                            iconCls: "coreshop_icon_taxes",
                            handler: this.openTaxes
                        });
                    }

                    if(user.isAllowed("coreshop_permission_tax_rules")) {
                        localizationMenu.push({
                            text: t("coreshop_tax_rule_groups"),
                            iconCls: "coreshop_icon_tax_rule_groups",
                            handler: this.openTaxRuleGroups
                        });
                    }

                    if(localizationMenu.length > 0) {
                        coreShopMenuItems.push({
                            text: t("coreshop_localization"),
                            iconCls: "coreshop_icon_localization",
                            hideOnClick: false,
                            menu: {
                                cls: "pimcore_navigation_flyout",
                                shadow: false,
                                items: localizationMenu
                            }
                        });
                    }

                    if(user.isAllowed("coreshop_permission_orderStates")) {
                        coreShopMenuItems.push({
                            text: t("coreshop_order"),
                            iconCls: "coreshop_icon_order",
                            hideOnClick: false,
                            menu: {
                                cls: "pimcore_navigation_flyout",
                                shadow: false,
                                items: [{
                                    text: t("coreshop_order_states"),
                                    iconCls: "coreshop_icon_order_states",
                                    handler: this.openOrderStates
                                }]
                            }
                        });
                    }

                    if(user.isAllowed("coreshop_permission_carriers")) {
                        coreShopMenuItems.push({
                            text: t("coreshop_shipping"),
                            iconCls: "coreshop_icon_shipping",
                            hideOnClick: false,
                            menu: {
                                shadow: false,
                                cls: "pimcore_navigation_flyout",
                                items: [{
                                    text: t("coreshop_carriers"),
                                    iconCls: "coreshop_icon_carriers",
                                    handler: this.openCarriersList
                                }]
                            }
                        });
                    }

                    if (user.admin) {
                        coreShopMenuItems.push({
                            text: t("coreshop_update"),
                            iconCls: "pimcore_icon_update",
                            handler: function () {
                                new coreshop.update();
                            }
                        });
                    }
                }
                else {
                    if (user.admin) {
                        coreShopMenuItems.push({
                            text: t("coreshop_install"),
                            iconCls: "coreshop_icon_setup",
                            handler: this.openSetup
                        });
                    }
                }

                if(coreShopMenuItems.length > 0) {
                    var menu = new Ext.menu.Menu({
                        items: coreShopMenuItems,
                        shadow: false,
                        cls: "pimcore_navigation_flyout"
                    });

                    Ext.get('pimcore_menu_logout').insertSibling('<li id="pimcore_menu_coreshop" class="pimcore_menu_item icon-coreshop-shop">' + t("coreshop") + '</li>');
                    Ext.get("pimcore_menu_coreshop").on("mousedown", function (e, el) {
                        if (!self.isInitialized) {
                            Ext.Msg.alert(t('coreshop'), t('coreshop_not_initialized'));
                        }
                        else {
                            toolbar.showSubMenu.call(menu, e, el);
                        }
                    });
                }

                pimcore.plugin.coreshop.global.initialize(this.settings);

            }.bind(this)
        });
    },

    postOpenObject : function(tab, type)
    {
        if(tab.data.general.o_className == "CoreShopCart")
        {
            tab.toolbar.insert(tab.toolbar.items.length,
                '-'
            );
            tab.toolbar.insert(tab.toolbar.items.length,
                {
                    text: t("coreshop_cart_create_order"),
                    scale: "medium",
                    iconCls: "coreshop_icon_create_order",
                    handler: function() {
                        alert("Create Order from Cart");
                    }
                }
            );
        }
    },

    openSettings : function()
    {
        try {
            pimcore.globalmanager.get("coreshop_settings").activate();
        }
        catch (e) {
            //console.log(e);
            pimcore.globalmanager.add("coreshop_settings", new pimcore.plugin.coreshop.settings());
        }
    },

    openPriceRules : function()
    {
        try {
            pimcore.globalmanager.get("coreshop_price_rules").activate();
        }
        catch (e) {
            //console.log(e);
            pimcore.globalmanager.add("coreshop_price_rules", new pimcore.plugin.coreshop.pricerule.panel());
        }
    },

    openCurrencyList : function() {
        try {
            pimcore.globalmanager.get("coreshop_currency").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_currency", new pimcore.plugin.coreshop.currencies.panel());
        }
    },

    openZoneList : function() {
        try {
            pimcore.globalmanager.get("coreshop_zones").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_zones", new pimcore.plugin.coreshop.zones.panel());
        }
    },

    openCountryList : function() {
        try {
            pimcore.globalmanager.get("coreshop_country").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_country", new pimcore.plugin.coreshop.countries.panel());
        }
    },

    openCarriersList : function() {
        try {
            pimcore.globalmanager.get("coreshop_carriers").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_carriers", new pimcore.plugin.coreshop.carriers.panel());
        }
    },

    openSetup : function() {
        try {
            pimcore.globalmanager.get("coreshop_install").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_install", new pimcore.plugin.coreshop.install());
        }
    },

    openOrderStates : function() {
        try {
            pimcore.globalmanager.get("coreshop_order_states").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_order_states", new pimcore.plugin.coreshop.orderstate.panel());
        }
    },

    openTaxes : function() {
        try {
            pimcore.globalmanager.get("coreshop_taxes").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_taxes", new pimcore.plugin.coreshop.tax.panel());
        }
    },

    openTaxRuleGroups : function() {
        try {
            pimcore.globalmanager.get("coreshop_tax_rule_groups").activate();
        }
        catch (e) {
            pimcore.globalmanager.add("coreshop_tax_rule_groups", new pimcore.plugin.coreshop.taxrulegroup.panel());
        }
    }
});

new pimcore.plugin.coreshop();