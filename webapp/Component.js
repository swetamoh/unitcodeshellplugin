/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
    function (UIComponent, JSONModel, MessageBox) {
        "use strict";

        return UIComponent.extend("sp.fiori.unitcodeshellplugin.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                if (!this.busyDialog) {
                    this.busyDialog = sap.ui.xmlfragment("sp.fiori.unitcodeshellplugin.fragment.BusyDialog", this);
                }
                this.busyDialog.open();

                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                this.getModel().metadataLoaded(true).then(() => {
                    // metadata success
                    sap.ushell.Container.getRenderer("fiori2").addActionButton("sap.m.Button", {
                        icon: "sap-icon://customize",
                        text: "Unit Code",
                        press: () => this.openDialog()
                    }, true, false, ["home", "app"]);

                    // if (sessionStorage.getItem("unitCode")) {
                    //     this.addSubHead(sessionStorage.getItem("unitCode").split(","), sessionStorage.getItem("unitCodeText").split(","));
                    // } else {
                    this.getData();
                    // }
                }).catch(err => {
                    // metadata error
                    this.handleError(err.responseText);
                    this.busyDialog.close();
                });

                // odata request failed
                this.getModel().attachRequestFailed(err =>
                    this.handleError(err.getParameter("response").responseText));

                // launchpad logout event
                sap.ushell.Container.attachLogoutEvent(() => sessionStorage.clear());
            },


            getData() {
                this.getModel().read("/UnitCodes", {
                    success: data => {
                        if (data.results.length > 0) {
                            this.data = data.results;
                            var selected = [];
                            for (var i = 0; i < data.results.length; i++) {
                                selected.push(data.results[i].code)
                            }
                            sessionStorage.setItem("unitCode", selected);
                            sessionStorage.setItem("CodeDetails", JSON.stringify(this.data));
                        }

                        // this.dialog = sap.ui.xmlfragment("sp.fiori.unitcodeshellplugin.fragment.Dialog", this);
                        // this.dialog.setModel(new JSONModel(data.results), "UnitCode");

                        //dialog.open();
                        // if (sessionStorage.getItem("unitCode")) {
                        //     sap.ui.getCore().byId("unitCode").setSelectedKeys(sessionStorage.getItem("unitCode").split(","));
                        //     //sap.ui.getCore().byId("companyCodeText").setVisible(true).setText(sessionStorage.getItem("unitCodeText"));
                        // } else {

                        //var unitCode = sap.ui.getCore().byId("unitCode");
                        //unitCode.setSelectedKeys(selected);
                        //var uCode = unitCode.getSelectedKeys();
                        // var uCodeText = [];
                        // for (var i = 0; i < unitCode.getSelectedItems().length; i++) {
                        //     uCodeText.push(unitCode.getSelectedItems()[i].getProperty("additionalText"));
                        // }
                        // sessionStorage.setItem("tempunitCode", uCode);

                        //sessionStorage.setItem("unitCode", 'P05');
                        //sessionStorage.setItem("unitCodeText", uCodeText);

                        //}
                        this.busyDialog.close();
                    },
                    error: () => this.busyDialog.close()
                });
            },

            openDialog() {
                this.dialog = sap.ui.xmlfragment("sp.fiori.unitcodeshellplugin.fragment.Dialog", this);
                this.dialog.setModel(new JSONModel(this.data), "UnitCode");
                this.dialog.open();
                if (sessionStorage.getItem("unitCode")) {
                    sap.ui.getCore().byId("unitCode").setSelectedKeys(sessionStorage.getItem("unitCode").split(","));
                    //sap.ui.getCore().byId("companyCodeText").setVisible(true).setText(sessionStorage.getItem("unitCodeText"));
                } else {
                    var selected = [];
                    for (var i = 0; i < this.data.length; i++) {
                        selected.push(this.data[i].code)
                    }
                    sap.ui.getCore().byId("unitCode").setSelectedKeys(selected);
                }
            },

            onApplyPress: function (evt) {
                var unitCode = sap.ui.getCore().byId("unitCode");
                if (unitCode.getSelectedKeys() !== "") {
                    unitCode.setValueState("None");
                    // var uCodeText = [];
                    // for (var i = 0; i < unitCode.getSelectedItems().length; i++) {
                    //     uCodeText.push(unitCode.getSelectedItems()[i].getProperty("additionalText"));
                    // }
                    sessionStorage.setItem("unitCode", unitCode.getSelectedKeys());
                    //sessionStorage.setItem("unitCode", 'P05');
                    // sessionStorage.setItem("unitCodeText", uCodeText);
                    sessionStorage.setItem("CodeDetails", JSON.stringify(this.data));
                    //this.addSubHead(uCode, uCodeText);
                    evt.getSource().getParent().destroy();
                } else {
                    unitCode.setValueState("Error");
                }
            },

            // addSubHead: function (unitCode, unitText) {
            //     var headerText = "";
            //     for (var i = 0; i < unitCode.length; i++) {
            //         headerText = headerText + unitCode[i] + " (" + unitText[i] + ")" + ",";
            //     }
            //     headerText = headerText.substring(0, headerText.length - 1)
            //     sap.ushell.Container.getRenderer("fiori2").addShellSubHeader({
            //         controlType: "sap.m.Bar",
            //         oControlProperties: {
            //             contentMiddle: [new sap.m.ObjectAttribute({
            //                 title: "Unit Code",
            //                 text: headerText
            //             })]
            //         },
            //         bIsVisible: true,
            //         bCurrentState: false,
            //         aStates: ["home", "app"]
            //     });
            //     this.busyDialog.close();
            // },

            // onCompCodeSelectionChange: function (evt) {
            //     // var companyText = evt.getParameter("selectedItem").getAdditionalText();
            //     // sap.ui.getCore().byId("companyCodeText").setVisible(true).setText(companyText);
            // },

            onDialogEscapeHandler: function (oPromise) {
                oPromise.reject();
            },

            handleError: function (responseText) {
                if (responseText.indexOf("<?xml") !== -1) {
                    MessageBox.error($($.parseXML(responseText)).find("message").text());
                } else if (responseText.indexOf("{") !== -1) {
                    MessageBox.error(JSON.parse(responseText).error.message.value);
                } else {
                    MessageBox.error(responseText);
                }
            }
        });
    }
);