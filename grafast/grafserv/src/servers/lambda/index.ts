import 'console'

import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GrafservBase, GrafservConfig, RequestDigest, processHeaders } from 'grafserv';
import { toArray } from 'modern-async';

export class LambdaGrafserv extends GrafservBase {
	createHandler() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const serv = this;
		return async function (
			event: APIGatewayEvent,
			context: Context,
		): Promise<APIGatewayProxyResult> {
			const version = event.requestContext.protocol.match(
				'^HTTP/(?<major>[0-9]+).(?<minor>[0-9]+)$',
			);

			const request: RequestDigest = {
				httpVersionMajor: parseInt(version?.groups?.major ?? '1'),
				httpVersionMinor: parseInt(version?.groups?.minor ?? '0'),
				isSecure: event.headers['X-Forwarded-Proto'] === 'https',
				method: event.httpMethod,
				path: event.requestContext.path,
				headers: processHeaders(event.multiValueHeaders),
				getQueryParams() {
					return Object.fromEntries(
						Object.entries(event.queryStringParameters ?? {}).filter(([_k, v]) => v !== undefined),
					) as Record<string, string>;
				},
				getBody() {
					return {
						type: 'text',
						text: event.body ?? '',
					};
				},
				requestContext: {
					lambda: {
						context,
					},
				} as Partial<Grafast.RequestContext>,
				preferJSON: true,
			};

			const response = await serv.processRequest(request);

			if (response === null) {
				return {
					statusCode: 404,
					body: '¯\\_(ツ)_/¯',
				};
			}

			switch (response.type) {
				case 'error': {
					const { statusCode, headers, error } = response;
					return {
						statusCode,
						headers: { ...headers, 'Content-Type': 'text/plain' },
						body: error.message,
					};
				}

				case 'buffer': {
					const { statusCode, headers, buffer } = response;
					return { statusCode, headers, body: buffer.toString() };
				}

				case 'json': {
					const { statusCode, headers, json } = response;
					return { statusCode, headers, body: JSON.stringify(json) };
				}

				case 'noContent': {
					const { statusCode, headers } = response;
					return { statusCode, headers, body: '' };
				}

				case 'bufferStream': {
					const { statusCode, headers, bufferIterator } = response;

					// TODO: implement low-latency path using awslambda.streamifyResponse
					// https://aws.amazon.com/blogs/compute/introducing-aws-lambda-response-streaming/
					return {
						statusCode,
						headers,
						body: Buffer.concat(await toArray(bufferIterator)).toString(),
					};
				}

				default: {
					console.log('Unhandled:');
					console.dir(response);
					return {
						statusCode: 503,
						headers: { 'Content-Type': 'text/plain' },
						body: "Server hasn't implemented this yet",
					};
				}
			}
		};
	}
}

export function grafserv(config: GrafservConfig) {
	return new LambdaGrafserv(config);
}
