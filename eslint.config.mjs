import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [{
	ignores: ['**/dist/', '**/*.spec.ts', '**/*.d.ts'],
}, ...compat.extends(
	'eslint:recommended',
	'plugin:@typescript-eslint/recommended',
), {
	plugins: {
		'@typescript-eslint': typescriptEslint,
		jsdoc,
	},

	languageOptions: {
		globals: {
			...globals.node,
		},

		parser: tsParser,
		ecmaVersion: 'latest',
		sourceType: 'module',
	},

	rules: {
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-var-requires': 'off',

		'@typescript-eslint/no-empty-function': ['error', {
			allow: ['constructors'],
		}],

		'arrow-body-style': ['error', 'as-needed'],
		'arrow-spacing': ['error'],
		'block-spacing': ['error', 'always'],

		'comma-spacing': ['error', {
			after: true,
			before: false,
		}],

		'comma-style': ['error', 'last'],
		'eol-last': ['error', 'always'],
		'func-call-spacing': ['error', 'never'],

		indent: ['error', 'tab', {
			SwitchCase: 1,
			ignoredNodes: ['PropertyDefinition'],
		}],

		'jsdoc/check-alignment': 'warn',
		'jsdoc/check-indentation': 'warn',
		'jsdoc/check-param-names': 'warn',
		'jsdoc/check-property-names': 'warn',
		'jsdoc/check-syntax': 'warn',
		'jsdoc/check-tag-names': 'warn',
		'jsdoc/check-types': 'warn',
		'jsdoc/check-values': 'warn',
		'jsdoc/empty-tags': 'warn',
		'jsdoc/implements-on-classes': 'warn',

		'jsdoc/match-description': ['warn', {
			matchDescription: '[?!*]*\\s*[A-Z].*[.?!]*',
			message: 'Description must be a complete sentence.',
		}],

		'jsdoc/multiline-blocks': 'warn',
		'jsdoc/no-bad-blocks': 'warn',
		'jsdoc/no-blank-block-descriptions': 'warn',
		'jsdoc/no-defaults': 'warn',
		'jsdoc/no-undefined-types': 'warn',
		'jsdoc/require-asterisk-prefix': 'warn',
		'jsdoc/require-description': 'warn',
		'jsdoc/require-param-name': 'warn',
		'jsdoc/require-property-name': 'warn',
		'jsdoc/require-returns': 'warn',
		'jsdoc/require-returns-check': 'warn',
		'jsdoc/require-throws': 'warn',

		'jsdoc/tag-lines': ['warn', 'any', {
			startLines: null,
		}],

		'jsdoc/valid-types': 'warn',

		'key-spacing': ['error', {
			afterColon: true,
			beforeColon: false,
			mode: 'strict',
		}],

		'keyword-spacing': ['error', {
			after: true,
			before: true,
		}],

		'max-len': ['error', {
			code: 100,
			ignoreComments: true,
			ignoreRegExpLiterals: true,
			ignoreStrings: true,
			ignoreTemplateLiterals: true,
			ignoreTrailingComments: true,
			ignoreUrls: true,
		}],

		'max-nested-callbacks': ['error', {
			max: 7,
		}],

		'new-parens': ['error'],

		'no-confusing-arrow': ['error', {
			allowParens: true,
		}],

		'no-console': ['off'],

		'no-constant-condition': ['error', {
			checkLoops: false,
		}],

		'no-empty-function': ['error', {
			allow: ['constructors'],
		}],

		'no-global-assign': ['error'],
		'no-lonely-if': ['error'],
		'no-prototype-builtins': ['off'],
		'no-self-compare': ['error'],
		'no-shadow-restricted-names': ['error'],
		'no-trailing-spaces': ['error'],
		'no-unneeded-ternary': ['error'],
		'no-unreachable': ['error'],
		'no-useless-computed-key': ['error'],
		'no-useless-concat': ['error'],
		'no-useless-escape': ['error'],
		'no-useless-rename': ['error'],
		'no-var': ['error'],
		'no-whitespace-before-property': ['error'],
		'object-curly-spacing': ['error', 'always'],
		'object-shorthand': ['error', 'always'],
		'operator-assignment': ['error', 'always'],
		'prefer-const': ['off'],
		'prefer-rest-params': ['error'],
		'prefer-spread': ['error'],
		quotes: ['error', 'single'],
		'rest-spread-spacing': ['error', 'never'],
		semi: ['error', 'always'],

		'semi-spacing': ['error', {
			after: true,
			before: false,
		}],

		'space-before-blocks': ['error', 'always'],
		'space-in-parens': ['error', 'never'],
		'space-infix-ops': ['error'],

		'space-unary-ops': ['error', {
			nonwords: false,
			words: true,
		}],

		'template-curly-spacing': ['error', 'never'],
	},
}];
