import axios from 'axios';

import * as MarkdownIt from 'markdown-it';
import * as mila from 'markdown-it-link-attributes';

const md = new MarkdownIt();
md.use(mila, { attrs: { target: '_blank', rel: 'noopener' } });

const apiUrl = 'https://app.monkedo.com/api/v1/ipaas';
let theme: ThemeOptions = {
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

export class Monkedo {
	/**
	 * Initialize Monkedo SDK.
	 *
	 * @param projectId
	 * @param appName In applications that use API-Key, the places where "Monkedo" is written in the description of the form
	 * that opens to connect an account are replaced with the value written here.
	 * @param themeOptions Customize the appearance of the modal dialog.
	 */
	constructor(projectId: string, appName: string, themeOptions?: ThemeOptions) {
		project = projectId;
		application = appName;

		if (themeOptions) this.setTheme(themeOptions);
	}

	async checkUserConnections(userId: string, appKeys: string[]): Promise<Record<string, 'connected' | 'not-connected' | 'invalid'>> {
		if (!userId || !appKeys.length) throw '"userId" and "appKeys" are required!';

		const { data } = await axios.get(`${apiUrl}/projects/${project}/users/${userId}/connections/status?appKeys=${appKeys.join(',')}`);

		return data;
	}

	async connectApp(params: CredentialParams): Promise<string> {
		const { userId, appKey, ...others } = params;
		if (!userId || !appKey) throw '"userId" and "appKey" are required!';

		const { data } = await axios.post(`${apiUrl}/projects/${project}/users/${userId}/connections/${appKey}`, others);

		// If the connection URL (only oauth apps) is returned, open a popup to connect the app.
		if (typeof data === 'string' && data.startsWith('http')) return await this.openPopupAndListen(data, userId, appKey);
		return 'CONNECTION_SUCCESS';
	}

	async getAppCredentialInfo(params: CredentialParams): Promise<void> {
		const { userId, appKey } = params;
		if (!userId || !appKey) throw '"userId" and "appKey" are required!';

		const { data } = await axios.get(`${apiUrl}/projects/${project}/apps/${appKey}/credential-info`);

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
			.then(() => this.closeModal())
			.catch((error) => {
				const form = document.getElementById('monkedo-credential-form') as HTMLFormElement;

				const errorDiv = document.getElementById('monkedo-connect-app-error');
				if (errorDiv) errorDiv.remove();

				const div = document.createElement('div');
				div.id = 'monkedo-connect-app-error';
				if (theme.classes?.alert) div.classList.add(...theme.classes.alert.box.split(' '), ...theme.classes.alert.error.split(' '));
				else div.style.cssText = `${theme.styles.alert.box} ${theme.styles.alert.error}`;

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
		['styles', 'classes'].forEach((type) => {
			if (!themeOptions[type]) return;

			Object.entries(themeOptions[type]).forEach(([key, value]) => {
				if (!theme[type]) theme[type] = {};

				if (typeof value !== 'object') {
					theme[type][key] = value;
					return;
				}

				if (!theme[type][key]) theme[type][key] = {};

				Object.entries(value).forEach(([k, v]) => theme[type][key][k] = v);
			});
		});
	}

	closeModal(): void {
		const dialog = document.getElementById('monkedo-dialog');
		if (dialog) {
			dialog.remove();
			document.getElementById('monkedo-sdk-style')!.remove();
		}
	}

	private async createForm(data: Record<string, any>): Promise<void> {
		document.body.insertAdjacentHTML('beforeend', modalHTML);
		document.head.insertAdjacentHTML('beforeend', modalStyle);

		const dialog = document.getElementById('monkedo-dialog') as HTMLDialogElement;
		if (theme.classes?.dialog) dialog.classList.add(...theme.classes.dialog.split(' '));
		else dialog.style.cssText = theme.styles.dialog;

		dialog.showModal();

		const modalHeader = document.getElementById('monkedo-dialog-header');
		if (theme.classes?.header) modalHeader.classList.add(...theme.classes.header.split(' '));
		else modalHeader.style.cssText = theme.styles.header;

		const title = document.createElement('span');
		if (theme.classes?.title) title.classList.add(...theme.classes.title.split(' '));
		else title.style.cssText = theme.styles.title;
		title.textContent = `Connect ${data.appName}`;
		modalHeader.insertBefore(title, modalHeader.lastElementChild);

		const modalBody = document.getElementById('monkedo-dialog-body');
		const desc = document.createElement('p');
		data.desc = data.desc.replace(/Monkedo/g, application);
		desc.innerHTML = md.render(data.desc);
		modalBody.appendChild(desc);

		const form = document.createElement('form');
		form.id = 'monkedo-credential-form';

		data.fields.forEach((field: Record<string, any>) => {
			const formGroup = document.createElement('div');
			formGroup.style.marginBottom = '10px';

			const label = document.createElement('label');
			label.setAttribute('for', field.name);
			label.textContent = field.name;
			formGroup.appendChild(label);

			let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
			let isTextArea = false;
			if (field.type === 'select') {
				input = document.createElement('select');

				field.options.forEach((option: any) => {
					const optionEl = document.createElement('option');
					optionEl.value = option.value;
					optionEl.textContent = option.label;
					input.appendChild(optionEl);
				});

				input.addEventListener('change', (event) => this.toggleInputs({ name: field.name, value: (event.target as any).value }, data.fields));
			} else {
				isTextArea = field.type === 'textarea';
				input = document.createElement(isTextArea ? 'textarea' : 'input');

				if (!isTextArea) (input as HTMLInputElement).type = field.type || 'text';
			}

			if (theme.classes?.input) input.classList.add(...theme.classes.input.split(' '));
			else input.style.cssText = theme.styles.input;

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
		if (theme.classes?.buttons?.save) submitButton.classList.add(...theme.classes.buttons.save.split(' '));
		else submitButton.style.cssText = theme.styles.buttons.save;
		submitButton.textContent = 'Save';
		form.appendChild(submitButton);

		form.addEventListener('submit', (event) => this.handleSubmit(event, data.userId, data.appKey));

		const closeButton = document.getElementById('monkedo-dialog-close');
		if (theme.classes?.buttons?.modalClose) closeButton.classList.add(...theme.classes.buttons.modalClose.split(' '));
		else closeButton.style.cssText = theme.styles.buttons.modalClose;
		closeButton.addEventListener('click', () => this.closeModal());

		modalBody.appendChild(form);

		const showWhenFields = data.fields
			.filter((field: Record<string, any>) => field.showWhen)
			.map((field: Record<string, any>) => field.showWhen.key)
			.filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
		if (showWhenFields.length) {
			showWhenFields.forEach((field: string) => {
				const mainField = data.fields.find((f: Record<string, any>) => f.name === field);
				this.toggleInputs({ name: field, value: mainField.options[0].value }, data.fields);
			});
		}
	}

	private async openPopupAndListen(url: string, userId: string, appKey: string): Promise<string> {
		return new Promise((resolve) => {
			const popup = window.open(url, 'oauthPopup', 'width=600,height=700');
			if (!popup) return resolve('POPUP_BLOCKED');

			const popupCheckInterval = setInterval(async () => {
				if (popup.closed) {
					const connections = await this.checkUserConnections(userId, [appKey]);
					clearInterval(popupCheckInterval);

					if (connections[appKey] === 'connected') resolve('CONNECTION_SUCCESS');
					else resolve('CONNECTION_FAILED');
				}
			}, 500);
		});
	}

	private toggleInputs(input: { name: string, value: string | number }, fields: Record<string, any>[]): void {
		fields.forEach((field) => {
			if (field.showWhen?.key !== input.name) return;

			const isShown = field.showWhen.value === input.value;

			const inputEl = document.getElementById(field.name) as HTMLInputElement;
			inputEl.style.display = isShown ? 'block' : 'none';
			inputEl.required = isShown && !field.isOptional;
			inputEl.value = '';

			const label = inputEl.previousElementSibling as HTMLLabelElement;
			label.style.display = isShown ? 'block' : 'none';
		});
	}
}

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

export enum ErrorCodes {
	INVALID_PARAMETER = 1,
	CONNECTION_ALREADY_EXISTS = 222,
}

type ThemeOptions = {
	styles?: {
		dialog?: string;
		header?: string;
		title?: string;
		buttons?: {
			modalClose?: string;
			save?: string;
		};
		input?: string;
		alert?: {
			box?: string;
			error?: string;
		};
	};
	classes?: {
		dialog?: string;
		header?: string;
		title?: string;
		buttons?: {
			modalClose?: string;
			save?: string;
		};
		input?: string;
		alert?: {
			box?: string;
			error?: string;
		};
	};
};

type CredentialParams = {
	userId: string;
	appKey: string;
	[key: string]: any;
};
