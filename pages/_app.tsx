import { css, Global } from "@emotion/react";
import { CssBaseline } from "@mui/joy";
import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import type { AppProps } from "next/app";
import Head from "next/head";

const theme = extendTheme({
	colorSchemes: {
		light: {
			palette: {},
		},
		dark: {
			palette: {},
		},
	},
});

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<CssVarsProvider theme={theme} defaultMode="system">
			<CssBaseline />
			<Global
				styles={css({
					"html, body": { height: "100%" },
					"#__next": { display: "contents" },
				})}
			/>
			<Head>
				<title>Caption Me by failfa.st</title>
				<meta
					name="description"
					content="Caption me is a tool that simplifies captioning of training data"
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
				<meta name="msapplication-TileColor" content="#223431" />
				<meta name="theme-color" content="#ffffff" />
			</Head>
			<Component {...pageProps} />
		</CssVarsProvider>
	);
}

export default MyApp;
