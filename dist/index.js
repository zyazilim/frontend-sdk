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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.Monkedo = void 0;
const axios_1 = require("axios");
const bootstrap = require("bootstrap");
const MarkdownIt = require("markdown-it");
const mila = require("markdown-it-link-attributes");
const md = new MarkdownIt();
md.use(mila, { attrs: { target: '_blank', rel: 'noopener' } });
let credentialModal;
const apiUrl = 'http://localhost:3000/api/v1/ipaas';
let theme = {
    headers: {
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
    },
    buttons: {
        modalClose: 'btn btn-sm btn-secondary',
        save: 'btn btn-primary float-end'
    }
};
let pId = '';
class Monkedo {
    constructor(projectId, themeOptions) {
        pId = projectId;
        if (themeOptions)
            this.setTheme(themeOptions);
    }
    checkUserConnections(userId, appKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId || !appKeys.length)
                throw '"userId" and "appKeys" are required!';
            const { data } = yield axios_1.default.get(`${apiUrl}/projects/${pId}/users/${userId}/connections/status?appKeys=${appKeys.join(',')}`);
            return data;
        });
    }
    connectApp(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, appKey } = params, others = __rest(params, ["userId", "appKey"]);
            if (!userId || !appKey)
                throw '"userId" and "appKey" are required!';
            const { data } = yield axios_1.default.post(`${apiUrl}/projects/${pId}/users/${userId}/connections/${appKey}`, others);
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
            const { data } = yield axios_1.default.get(`${apiUrl}/projects/${pId}/apps/${appKey}/credential-info`);
            this.createForm(Object.assign(Object.assign({}, data), { userId, appKey }));
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
                var _a, _b, _c, _d;
                const form = document.getElementById('monkedo-credential-form');
                const errorDiv = document.getElementById('monkedo-connect-app-error');
                if (errorDiv)
                    errorDiv.remove();
                const div = document.createElement('div');
                div.id = 'monkedo-connect-app-error';
                div.className = 'alert alert-danger';
                let message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error;
                if (((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.code) === ErrorCodes.CONNECTION_ALREADY_EXISTS) {
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
        Object.entries(themeOptions).forEach(([key, value]) => {
            if (!theme[key])
                return;
            if (typeof value !== 'object') {
                theme[key] = value;
                return;
            }
            Object.entries(value).forEach(([k, v]) => {
                if (!theme[key][k])
                    return;
                theme[key][k] = v;
            });
        });
    }
    closeModal() {
        credentialModal.hide();
        const modal = document.getElementById('monkedo-modal');
        if (modal)
            modal.remove();
    }
    createForm(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (credentialModal)
                this.closeModal();
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const templateModal = document.getElementById('monkedo-modal');
            credentialModal = new bootstrap.Modal(templateModal);
            credentialModal.show();
            const modalHeader = document.getElementById('monkedo-modal-header');
            const h5 = document.createElement('h5');
            h5.className = `${theme.headers.h5} modal-title`;
            h5.textContent = `Connect ${data.appName}`;
            modalHeader.insertBefore(h5, modalHeader.lastElementChild);
            const modalBody = document.getElementById('monkedo-modal-body');
            const desc = document.createElement('p');
            desc.innerHTML = md.render(data.desc);
            modalBody.appendChild(desc);
            const form = document.createElement('form');
            form.id = 'monkedo-credential-form';
            data.fields.forEach((field) => {
                const formGroup = document.createElement('div');
                formGroup.className = 'mb-3';
                const label = document.createElement('label');
                label.className = 'form-label';
                label.setAttribute('for', field.name);
                label.textContent = field.name;
                formGroup.appendChild(label);
                const isTextArea = field.type === 'textarea';
                const input = document.createElement(isTextArea ? 'textarea' : 'input');
                input.className = 'form-control';
                input.id = field.name;
                input.name = field.name;
                input.required = !field.isOptional;
                if (!isTextArea)
                    input.type = field.type || 'text';
                formGroup.appendChild(input);
                form.appendChild(formGroup);
            });
            const submitButton = document.createElement('button');
            submitButton.id = 'monkedo-connect-app';
            submitButton.className = theme.buttons.save;
            submitButton.textContent = 'Save';
            form.appendChild(submitButton);
            form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));
            document.getElementById('monkedo-modal-close').addEventListener('click', () => this.closeModal());
            modalBody.appendChild(form);
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
                        const connections = yield this.checkUserConnections(userId, [appKey]);
                        clearInterval(popupCheckInterval);
                        if (connections[appKey] === 'connected')
                            resolve('CONNECTION_SUCCESS');
                        else
                            resolve('CONNECTION_FAILED');
                    }
                }), 500);
            });
        });
    }
}
exports.Monkedo = Monkedo;
const modalHTML = `
<div id="monkedo-modal" class="modal fade">
	<div class="modal-dialog">
		<div class="modal-content">
			<div id="monkedo-modal-header" class="modal-header">
				<button id="monkedo-modal-close" type="button" class="${theme.buttons.modalClose}">Close</button>
			</div>
			<div id="monkedo-modal-body" class="modal-body"></div>
		</div>
	</div>
</div>
`;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["INVALID_PARAMETER"] = 1] = "INVALID_PARAMETER";
    ErrorCodes[ErrorCodes["CONNECTION_ALREADY_EXISTS"] = 222] = "CONNECTION_ALREADY_EXISTS";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
