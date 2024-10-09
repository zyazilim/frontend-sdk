"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.Monkedo = void 0;
const axios_1 = __importDefault(require("axios"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const markdown_it_link_attributes_1 = __importDefault(require("markdown-it-link-attributes"));
const md = new markdown_it_1.default();
md.use(markdown_it_link_attributes_1.default, { attrs: { target: '_blank', rel: 'noopener' } });
const apiUrl = 'https://app.monkedo.com/api/v1/ipaas';
let theme = {
    styles: {
        dialog: 'padding: 30px; border: none; border-radius: 10px; width: 600px;',
        header: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;',
        title: 'font-size: medium; font-weight: 600;',
        buttons: {
            modalClose: 'border: 1px solid #DDD; padding: 5px 10px; border-radius: 10px;',
            save: 'border: 1px solid #0E8838; padding: 5px 10px; border-radius: 10px; background-color: #17C653; color: white; float: right;',
        },
        input: 'display: block; width: 100%; background-color: #FFF; border-radius: 10px; height: 30px; color: #2E384D; border: 1px solid #EDEDED; padding-left: 10px;',
        alert: {
            box: 'padding: 10px; border-radius: 10px; margin-bottom: 10px;',
            error: 'background-color: #FFEEF3; border: 1px solid #fc97af; color: #F8285A;'
        }
    },
};
let project = '';
let application = '';
class Monkedo {
    /**
     * Initialize Monkedo SDK.
     *
     * @param projectId
     * @param appName In applications that use API-Key, the places where "Monkedo" is written in the description of the form
     * that opens to connect an account are replaced with the value written here.
     * @param themeOptions Customize the appearance of the modal dialog.
     */
    constructor(projectId, appName, themeOptions) {
        project = projectId;
        application = appName;
        if (themeOptions)
            this.setTheme(themeOptions);
    }
    checkUserConnections(userId, appKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId || !appKeys.length)
                throw '"userId" and "appKeys" are required!';
            const { data } = yield axios_1.default.get(`${apiUrl}/projects/${project}/users/${userId}/connections/status?appKeys=${appKeys.join(',')}`);
            return data;
        });
    }
    connectApp(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, appKey } = params, others = __rest(params, ["userId", "appKey"]);
            if (!userId || !appKey)
                throw '"userId" and "appKey" are required!';
            const { data } = yield axios_1.default.post(`${apiUrl}/projects/${project}/users/${userId}/connections/${appKey}`, others);
            // If the connection URL (only oauth apps) is returned, open a popup to connect the app.
            if (typeof data === 'string' && data.startsWith('http'))
                return yield this.openPopupAndListen(data, userId, appKey);
            return 'CONNECTION_SUCCESS';
        });
    }
    getAppCredentialInfo(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, appKey } = params;
            if (!userId || !appKey)
                throw '"userId" and "appKey" are required!';
            const { data } = yield axios_1.default.get(`${apiUrl}/projects/${project}/apps/${appKey}/credential-info`);
            this.createForm(Object.assign(Object.assign({}, data), { userId, appKey }));
            return yield this.listenModalClose(userId, appKey);
        });
    }
    handleSubmit(event, userId, appKey) {
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            yield this.connectApp({
                userId,
                appKey,
                connectionFields: data,
            })
                .then(() => this.closeModal())
                .catch((error) => {
                var _a, _b, _c, _d, _e;
                const form = document.getElementById('monkedo-credential-form');
                const errorDiv = document.getElementById('monkedo-connect-app-error');
                if (errorDiv)
                    errorDiv.remove();
                const div = document.createElement('div');
                div.id = 'monkedo-connect-app-error';
                if ((_a = theme.classes) === null || _a === void 0 ? void 0 : _a.alert)
                    div.classList.add(...theme.classes.alert.box.split(' '), ...theme.classes.alert.error.split(' '));
                else
                    div.style.cssText = `${theme.styles.alert.box} ${theme.styles.alert.error}`;
                let message = ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error;
                if (((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.code) === ErrorCodes.CONNECTION_ALREADY_EXISTS) {
                    message = 'Connection already exists. Please disconnect the existing connection to connect again.';
                }
                else if (message === 'Request failed with status code 401') {
                    message = 'Unauthorized. Please check your credentials.';
                }
                div.textContent = message;
                form.insertBefore(div, form.lastElementChild);
                setTimeout(() => {
                    const errorDiv = document.getElementById('monkedo-connect-app-error');
                    if (errorDiv)
                        errorDiv.remove();
                }, 10000);
            });
        });
    }
    setTheme(themeOptions) {
        ['styles', 'classes'].forEach((type) => {
            if (!themeOptions[type])
                return;
            Object.entries(themeOptions[type]).forEach(([key, value]) => {
                if (!theme[type])
                    theme[type] = {};
                if (typeof value !== 'object') {
                    theme[type][key] = value;
                    return;
                }
                if (!theme[type][key])
                    theme[type][key] = {};
                Object.entries(value).forEach(([k, v]) => theme[type][key][k] = v);
            });
        });
    }
    closeModal() {
        const dialog = document.getElementById('monkedo-dialog');
        if (dialog) {
            dialog.remove();
            document.getElementById('monkedo-sdk-style').remove();
        }
    }
    createForm(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            document.head.insertAdjacentHTML('beforeend', modalStyle);
            const dialog = document.getElementById('monkedo-dialog');
            if ((_a = theme.classes) === null || _a === void 0 ? void 0 : _a.dialog)
                dialog.classList.add(...theme.classes.dialog.split(' '));
            else
                dialog.style.cssText = theme.styles.dialog;
            dialog.showModal();
            const modalHeader = document.getElementById('monkedo-dialog-header');
            if ((_b = theme.classes) === null || _b === void 0 ? void 0 : _b.header)
                modalHeader.classList.add(...theme.classes.header.split(' '));
            else
                modalHeader.style.cssText = theme.styles.header;
            const title = document.createElement('span');
            if ((_c = theme.classes) === null || _c === void 0 ? void 0 : _c.title)
                title.classList.add(...theme.classes.title.split(' '));
            else
                title.style.cssText = theme.styles.title;
            title.textContent = `Connect ${data.appName}`;
            modalHeader.insertBefore(title, modalHeader.lastElementChild);
            const modalBody = document.getElementById('monkedo-dialog-body');
            const desc = document.createElement('p');
            data.desc = data.desc.replace(/Monkedo/g, application);
            desc.innerHTML = md.render(data.desc);
            modalBody.appendChild(desc);
            const form = document.createElement('form');
            form.id = 'monkedo-credential-form';
            data.fields.forEach((field) => {
                var _a;
                const formGroup = document.createElement('div');
                formGroup.style.marginBottom = '10px';
                const label = document.createElement('label');
                label.setAttribute('for', field.name);
                label.textContent = field.name;
                formGroup.appendChild(label);
                let input;
                let isTextArea = false;
                if (field.type === 'select') {
                    input = document.createElement('select');
                    field.options.forEach((option) => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option.value;
                        optionEl.textContent = option.label;
                        input.appendChild(optionEl);
                    });
                    input.addEventListener('change', (event) => this.toggleInputs({ name: field.name, value: event.target.value }, data.fields));
                }
                else {
                    isTextArea = field.type === 'textarea';
                    input = document.createElement(isTextArea ? 'textarea' : 'input');
                    if (!isTextArea)
                        input.type = field.type || 'text';
                }
                if ((_a = theme.classes) === null || _a === void 0 ? void 0 : _a.input)
                    input.classList.add(...theme.classes.input.split(' '));
                else
                    input.style.cssText = theme.styles.input;
                input.id = field.name;
                input.name = field.name;
                input.required = !field.isOptional;
                formGroup.appendChild(input);
                const inputDesc = document.createElement('span');
                inputDesc.style.cssText = 'font-size: 11px; color: #666; font-style: italic;';
                inputDesc.textContent = field.desc;
                formGroup.appendChild(inputDesc);
                form.appendChild(formGroup);
            });
            const submitButton = document.createElement('button');
            submitButton.id = 'monkedo-connect-app';
            if ((_e = (_d = theme.classes) === null || _d === void 0 ? void 0 : _d.buttons) === null || _e === void 0 ? void 0 : _e.save)
                submitButton.classList.add(...theme.classes.buttons.save.split(' '));
            else
                submitButton.style.cssText = theme.styles.buttons.save;
            submitButton.textContent = 'Save';
            form.appendChild(submitButton);
            form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));
            const closeButton = document.getElementById('monkedo-dialog-close');
            if ((_g = (_f = theme.classes) === null || _f === void 0 ? void 0 : _f.buttons) === null || _g === void 0 ? void 0 : _g.modalClose)
                closeButton.classList.add(...theme.classes.buttons.modalClose.split(' '));
            else
                closeButton.style.cssText = theme.styles.buttons.modalClose;
            closeButton.addEventListener('click', () => this.closeModal());
            modalBody.appendChild(form);
            const showWhenFields = data.fields
                .filter((field) => field.showWhen)
                .map((field) => field.showWhen.key)
                .filter((value, index, self) => self.indexOf(value) === index);
            if (showWhenFields.length) {
                showWhenFields.forEach((field) => {
                    const mainField = data.fields.find((f) => f.name === field);
                    this.toggleInputs({ name: field, value: mainField.options[0].value }, data.fields);
                });
            }
        });
    }
    openPopupAndListen(url, userId, appKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const popup = window.open(url, 'oauthPopup', 'width=600,height=700');
                if (!popup)
                    return resolve('POPUP_BLOCKED');
                const popupCheckInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    if (popup.closed) {
                        clearInterval(popupCheckInterval);
                        const connections = yield this.checkUserConnections(userId, [appKey]);
                        if (connections[appKey] === 'connected')
                            resolve('CONNECTION_SUCCESS');
                        else
                            resolve('CONNECTION_FAILED');
                    }
                }), 500);
            });
        });
    }
    listenModalClose(userId, appKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const modalCheckInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    if (!document.getElementById('monkedo-dialog')) {
                        clearInterval(modalCheckInterval);
                        const connections = yield this.checkUserConnections(userId, [appKey]);
                        if (connections[appKey] === 'connected')
                            resolve('CONNECTION_SUCCESS');
                        else
                            resolve('CONNECTION_FAILED');
                    }
                }), 500);
            });
        });
    }
    toggleInputs(input, fields) {
        fields.forEach((field) => {
            var _a;
            if (((_a = field.showWhen) === null || _a === void 0 ? void 0 : _a.key) !== input.name)
                return;
            const isShown = field.showWhen.value === input.value;
            const inputEl = document.getElementById(field.name);
            inputEl.style.display = isShown ? 'block' : 'none';
            inputEl.required = isShown && !field.isOptional;
            inputEl.value = '';
            const label = inputEl.previousElementSibling;
            label.style.display = isShown ? 'block' : 'none';
        });
    }
}
exports.Monkedo = Monkedo;
const modalHTML = `
<dialog id="monkedo-dialog">
	<div id="monkedo-dialog-header">
		<button id="monkedo-dialog-close" type="button">Close</button>
	</div>
	<div id="monkedo-dialog-body"></div>
</div>
`;
const modalStyle = `
<style id="monkedo-sdk-style">
	dialog#monkedo-dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
`;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["INVALID_PARAMETER"] = 1] = "INVALID_PARAMETER";
    ErrorCodes[ErrorCodes["CONNECTION_ALREADY_EXISTS"] = 222] = "CONNECTION_ALREADY_EXISTS";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
