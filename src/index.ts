import axios from 'axios';

import * as bootstrap from 'bootstrap';
import * as MarkdownIt from 'markdown-it';
import * as mila from 'markdown-it-link-attributes';

const md = new MarkdownIt();
md.use(mila, { attrs: { target: '_blank', rel: 'noopener' } });

let credentialModal: bootstrap.Modal;

const apiUrl = 'http://localhost:3000/api/v1/ipaas';
let theme: ThemeOptions = {
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

export class Monkedo {
	constructor(projectId: string, themeOptions?: ThemeOptions) {
		pId = projectId;

		if (themeOptions) this.setTheme(themeOptions);
	}

	async connectApp(params: Record<string, any>): Promise<void> {
		const { userId, appKey, ...others } = params;
		if (!userId || !appKey) throw '"userId" and "appKey" are required!';

		const { data } = await axios.post(`${apiUrl}/projects/${pId}/users/${userId}/connections/${appKey}`, others);

		if (typeof data === 'string' && data.startsWith('http')) {
			window.open(data, null, 'toolbar=0,width=650,height=750');
		}

		// FIXME Library should return the success message
	}

	async getAppCredentialInfo(params: Record<string, any>): Promise<void> {
		const { userId, appKey } = params;
		if (!userId || !appKey) throw '"userId" and "appKey" are required!';

		const { data } = await axios.get(`${apiUrl}/projects/${pId}/apps/${appKey}/credential-info`);

		this.createForm({ ...data, userId, appKey });
	}

	async handleSubmit(event: Event, userId: string, appKey: string): Promise<void> {
		event.preventDefault();

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());

		await this.connectApp({
			userId,
			appKey,
			connectionFields: data,
		})
			.then(() => credentialModal.hide())
			.catch((error) => {
				const form = document.getElementById('monkedo-credential-form') as HTMLFormElement;

				const errorDiv = document.getElementById('monkedo-connect-app-error');
				if (errorDiv) errorDiv.remove();

				const div = document.createElement('div');
				div.id = 'monkedo-connect-app-error';
				div.className = 'alert alert-danger';

				let message = error.response?.data?.message || error;
				if (error.response?.data?.code === ErrorCodes.CONNECTION_ALREADY_EXISTS) {
					message = 'Connection already exists. Please disconnect the existing connection to connect again.';
				} else if (message === 'Request failed with status code 401') {
					message = 'Unauthorized. Please check your credentials.';
				}

				div.textContent = message;

				form.insertBefore(div, form.lastElementChild);

				setTimeout(() => {
					const errorDiv = document.getElementById('monkedo-connect-app-error');
					if (errorDiv) errorDiv.remove();
				}, 10000);
			});
	}

	setTheme(themeOptions: ThemeOptions): void {
		Object.entries(themeOptions).forEach(([key, value]) => {
			if (!theme[key]) return;

			if (typeof value !== 'object') {
				theme[key] = value;
				return;
			}

			Object.entries(value).forEach(([k, v]) => {
				if (!theme[key][k]) return;
				theme[key][k] = v;
			});
		});
	}

	closeModal(): void {
		credentialModal.hide();
	}

	private async createForm(data: Record<string, any>): Promise<void> {
		if (credentialModal) {
			credentialModal.show();
			return;
		}

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
		submitButton.id = 'monkedo-connect-app';
		submitButton.className = theme.buttons.save;
		submitButton.textContent = 'Save';
		form.appendChild(submitButton);

		form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));
		document.getElementById('monkedo-modal-close').addEventListener('click', () => this.closeModal());

		modalBody.appendChild(form);
	}
}

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

export enum ErrorCodes {
	INVALID_PARAMETER = 1,
	CONNECTION_ALREADY_EXISTS = 222,
}

type ThemeOptions = {
	headers?: {
		h1?: string;
		h2?: string;
		h3?: string;
		h4?: string;
		h5?: string;
		h6?: string;
	};
	buttons?: {
		modalClose?: string;
		save?: string;
	};
};
