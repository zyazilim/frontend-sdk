import axios from 'axios';

import * as bootstrap from 'bootstrap';
import * as MarkdownIt from 'markdown-it';
import * as mila from 'markdown-it-link-attributes';

const md = new MarkdownIt();
md.use(mila, { attrs: { target: '_blank', rel: 'noopener' } });

// Monkedo API URL, If local development, use 'http://localhost:3000/api/v1/ipaas'
const apiUrl = 'http://localhost:3000/api/v1/ipaas';
let pId = '';

let popupWindows: Record<string, Window[]> = {};
let credentialModal: bootstrap.Modal;

export class Monkedo {
	constructor(projectId: string) {
		pId = projectId;
	}

	async connectApp(params: Record<string, any>) {
		const { userId, appKey, ...others } = params;

		const { data } = await axios.post(`${apiUrl}/projects/${pId}/users/${userId}/connections/${appKey}`, others);

		// Open popup window to connect app
		if (typeof data === 'string' && data.startsWith('http')) {
			await this.openConsentWindow(data, appKey).catch((error) => {
				throw error;
			});
		}

		return 'Connected successfully';
	}

	async getAppCredentialInfo(params: Record<string, any>) {
		const { userId, appKey } = params;

		const { data } = await axios.get(`${apiUrl}/projects/${pId}/apps/${appKey}/credential-info`);

		this.createForm({ ...data, userId, appKey });
	}

	async handleSubmit(event: Event, userId: string, appKey: string) {
		event.preventDefault();

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());

		this.connectApp({
			userId,
			appKey,
			connectionFields: data,
		})
			.then(() => credentialModal.hide())
			.catch((error) => {
				const form = document.getElementById('credentialForm') as HTMLFormElement;

				const errorDiv = document.getElementById('connectAppError');
				if (errorDiv) errorDiv.remove();

				const div = document.createElement('div');
				div.id = 'connectAppError';
				div.className = 'alert alert-danger';

				let message = error.response?.data?.message || error;
				if (error.response?.data?.code === ErrorCodes.CONNECTION_ALREADY_EXISTS) {
					message = 'Connection already exists. Please disconnect the existing connection to connect again.';
				}

				div.textContent = message;

				form.insertBefore(div, form.lastElementChild);

				setTimeout(() => {
					const errorDiv = document.getElementById('connectAppError');
					if (errorDiv) errorDiv.remove();
				}, 5000);
			});
	}

	private async openConsentWindow(url: string, appKey = ''): Promise<void> {
		let popup: Window;

		return new Promise((resolve, reject) => {
			popup = window.open(url, null, 'toolbar=0,width=650,height=750');

			if (!popup) {
				reject('Please disable your popup blocker and try again.');
				return;
			}

			if (appKey) {
				if (!popupWindows[appKey]) popupWindows[appKey] = [];
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
	}

	private async createForm(data: Record<string, any>) {
		document.body.insertAdjacentHTML('beforeend', credentialForm);

		credentialModal = new bootstrap.Modal(document.getElementById('credentialModal'));
		credentialModal.show();

		document.getElementById('formTitle')!.textContent = `Connect ${data.appName}`;
		document.getElementById('formDesc')!.innerHTML = md.render(data.desc);

		const form = document.getElementById('credentialForm') as HTMLFormElement;
		form.innerHTML = '';

		data.fields.forEach((field: Record<string, any>) => {
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

			if (!isTextArea) (input as HTMLInputElement).type = field.type || 'text';

			formGroup.appendChild(input);
			form.appendChild(formGroup);
		});

		const submitButton = document.createElement('button');
		submitButton.className = 'btn btn-primary float-end';
		submitButton.textContent = 'Save';
		form.appendChild(submitButton);

		form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));
	}
}

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

export enum ErrorCodes {
	INVALID_PARAMETER = 1,
	CONNECTION_ALREADY_EXISTS = 222,
}
