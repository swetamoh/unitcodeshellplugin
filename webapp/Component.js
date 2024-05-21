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

                    const modulePath = jQuery.sap.getModulePath("sp/fiori/unitcodeshellplugin");
                    $.ajax({
                        url: modulePath + "/user-api/attributes",
                        type: "GET",
                        success: res => {
                            const attributes = res;
                            this.getModel().setHeaders({
                                "loginId": attributes.login_name[0],
                                "loginType": attributes.type[0].substring(0, 1).toUpperCase()
                            });
                            this.userGroups = attributes.Groups;
                            this.getData();
                        }
                    });
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

                        if (this.userGroups.includes("CI_LEGACY_MASTER")) {
                            this.suppData = [];
                            this.getSupplierList();
                        } else {
                            this.busyDialog.close();
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
                    },
                    error: () => this.busyDialog.close()
                });
            },

            getSupplierList: function () {
                return new Promise((resolve, reject) => {
                    this.getModel().callFunction("/GetSupplierList", {
                        method: "GET",
                        success: (oData) => {
                            this.suppData = oData.results;
                            if (!sessionStorage.getItem("AddressCode")) {
                                this.openDialog();
                            }
                            this.busyDialog.close();
                            resolve();
                        },
                        error: () => {
                            this.busyDialog.close();
                            reject(new Error("Failed to fetch supplier data."));
                        }
                    });
                });
            },

            openDialog() {
                this.dialog = sap.ui.xmlfragment("sp.fiori.unitcodeshellplugin.fragment.Dialog", this);
                this.dialog.setModel(new JSONModel(this.data), "UnitCode");
                this.dialog.open();
                if (this.userGroups.includes("CI_LEGACY_MASTER")) {
                    sap.ui.getCore().byId("suppList").setVisible(true);
                    this.dialog.setModel(new JSONModel([]), "SupplierModel");
                    this.dialog.getModel("SupplierModel").setSizeLimit(this.suppData.length);
                    this.dialog.getModel("SupplierModel").setData(this.suppData);
                } else {
                    sap.ui.getCore().byId("suppList").setVisible(false);
                }
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

                if (sessionStorage.getItem("AddressCode")) {
                    sap.ui.getCore().byId("suppList").setSelectedKey(sessionStorage.getItem("AddressCode"));
                }
            },

            onApplyPress: function (evt) {
                let validate = [];

                const unitCode = sap.ui.getCore().byId("unitCode");
                if (unitCode.getSelectedKeys().length > 0) {
                    validate.push(true);
                    unitCode.setValueState("None");
                    sessionStorage.setItem("unitCode", unitCode.getSelectedKeys());
                    sessionStorage.setItem("CodeDetails", JSON.stringify(this.data));

                    // var uCodeText = [];
                    // for (var i = 0; i < unitCode.getSelectedItems().length; i++) {
                    //     uCodeText.push(unitCode.getSelectedItems()[i].getProperty("additionalText"));
                    // }
                    //sessionStorage.setItem("unitCode", 'P05');
                    // sessionStorage.setItem("unitCodeText", uCodeText);
                    //this.addSubHead(uCode, uCodeText);
                } else {
                    validate.push(false);
                    unitCode.setValueState("Error");
                }

                if (this.userGroups.includes("CI_LEGACY_MASTER")) {
                    const suppList = sap.ui.getCore().byId("suppList");
                    if (suppList.getSelectedKey() !== "") {
                        validate.push(true);
                        suppList.setValueState("None");
                        sessionStorage.setItem("AddressCodePO", suppList.getSelectedKey());
                        sessionStorage.setItem("AddressCodeASNSA", suppList.getSelectedKey());
                        sessionStorage.setItem("AddressCode", suppList.getSelectedKey());
                        sessionStorage.setItem("AddressCodeSA", suppList.getSelectedKey());
                        sessionStorage.setItem("AddressCodeINVASN", suppList.getSelectedKey());
                    } else {
                        validate.push(false);
                        suppList.setValueState("Error");
                    }
                }

                if (validate.every(item => item === true)) {
                    evt.getSource().getParent().destroy();
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