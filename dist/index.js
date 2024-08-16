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
// Monkedo API URL, If local development, use 'http://localhost:3000/api/v1/ipaas'
const apiUrl = 'http://localhost:3000/api/v1/ipaas';
let pId = '';
let popupWindows = {};
let credentialModal;
class Monkedo {
    constructor(projectId) {
        pId = projectId;
    }
    connectApp(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, appKey } = params, others = __rest(params, ["userId", "appKey"]);
            const { data } = yield axios_1.default.post(`${apiUrl}/projects/${pId}/users/${userId}/connections/${appKey}`, others);
            // Open popup window to connect app
            if (typeof data === 'string' && data.startsWith('http')) {
                yield this.openConsentWindow(data, appKey).catch((error) => {
                    throw error;
                });
            }
            return 'Connected successfully';
        });
    }
    getAppCredentialInfo(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, appKey } = params;
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
            this.connectApp({
                userId,
                appKey,
                connectionFields: data,
            })
                .then(() => credentialModal.hide())
                .catch((error) => {
                var _a, _b, _c, _d;
                const form = document.getElementById('credentialForm');
                const errorDiv = document.getElementById('connectAppError');
                if (errorDiv)
                    errorDiv.remove();
                const div = document.createElement('div');
                div.id = 'connectAppError';
                div.className = 'alert alert-danger';
                let message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error;
                if (((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.code) === ErrorCodes.CONNECTION_ALREADY_EXISTS) {
                    message = 'Connection already exists. Please disconnect the existing connection to connect again.';
                }
                div.textContent = message;
                form.insertBefore(div, form.lastElementChild);
                setTimeout(() => {
                    const errorDiv = document.getElementById('connectAppError');
                    if (errorDiv)
                        errorDiv.remove();
                }, 50000);
            });
        });
    }
    openConsentWindow(url, appKey = '') {
        return __awaiter(this, void 0, void 0, function* () {
            let popup;
            return new Promise((resolve, reject) => {
                popup = window.open(url, null, 'toolbar=0,width=650,height=750');
                if (!popup) {
                    reject('Please disable your popup blocker and try again.');
                    return;
                }
                if (appKey) {
                    if (!popupWindows[appKey])
                        popupWindows[appKey] = [];
                    popupWindows[appKey].push(popup);
                }
                // Check that window is closed.
                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 1000);
            });
        });
    }
    createForm(data) {
        return __awaiter(this, void 0, void 0, function* () {
            document.body.insertAdjacentHTML('beforeend', credentialForm);
            credentialModal = new bootstrap.Modal(document.getElementById('credentialModal'));
            credentialModal.show();
            document.getElementById('formTitle').textContent = `Connect ${data.appName}`;
            document.getElementById('formDesc').innerHTML = md.render(data.desc);
            const form = document.getElementById('credentialForm');
            form.innerHTML = '';
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
            submitButton.className = 'btn btn-primary float-end';
            submitButton.textContent = 'Save';
            form.appendChild(submitButton);
            form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));
        });
    }
}
exports.Monkedo = Monkedo;
const credentialForm = `
<div class="modal fade" id="credentialModal" tabindex="-1">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 id="formTitle" class="modal-title"></h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" ngbTooltip="Close"></button>
			</div>
			<div class="modal-body">
				<p id="formDesc" class="markdown"></p>
				<form id="credentialForm"></form>
			</div>
		</div>
	</div>
</div>
`;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["INVALID_PARAMETER"] = 1] = "INVALID_PARAMETER";
    ErrorCodes[ErrorCodes["CONNECTION_ALREADY_EXISTS"] = 222] = "CONNECTION_ALREADY_EXISTS";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
