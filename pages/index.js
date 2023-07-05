"use client";
import Image from "next/image";
import React from "react";
import {
	PublicKey,
	Transaction,
	Connection,
	clusterApiUrl,
	Keypair,
	LAMPORTS_PER_SOL,
	SystemProgram,
	sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

const getProvider = () => {
	if ("phantom" in window) {
		const provider = window.phantom?.solana;
		if (provider?.isPhantom) return provider;
	}
};

export default function Home() {
	const [provider, setProvider] = useState(undefined);
	const [walletKey, setWalletKey] = useState(undefined);
	const [wallet, setWallet] = useState(undefined);
	const [loader, setLoader] = useState();
	const [step, setStep] = useState(1);
	const [balanceNew, setBalanceNew] = useState();
	const [balancePhantom, setBalancePhantom] = useState();

	const getBalance = async (pubKey) => {
		const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
		const bal = (await connection.getBalance(pubKey)) / LAMPORTS_PER_SOL;
		return bal;
	};

	const stepOne = async () => {
		setLoader(true);
		// const skey = new Uint8Array([
		// 	192, 81, 243, 189, 5, 108, 174, 252, 137, 176, 118, 124, 180, 222, 127,
		// 	228, 82, 152, 188, 175, 37, 78, 197, 196, 179, 72, 137, 213, 235, 210,
		// 	148, 73, 28, 191, 219, 170, 127, 227, 222, 84, 155, 65, 189, 131, 24, 19,
		// 	91, 12, 5, 41, 109, 167, 65, 142, 44, 237, 76, 5, 161, 139, 126, 229, 53,
		// 	68,
		// ]);
		// const wallet = Keypair.fromSecretKey(skey);
		const wallet = new Keypair();
		console.log(Array.from(wallet.secretKey));
		setWallet(wallet);
		try {
			const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
			const pubKey = new PublicKey(wallet.publicKey);
			var bal = (await connection.getBalance(pubKey)) / LAMPORTS_PER_SOL;
			if (bal > 0) {
				console.log(
					"Balance of " + pubKey.toString() + " is " + bal.toString() + " SOL"
				);
			} else {
				console.log("Airdropping 2 SOL in " + pubKey.toString());
				const airdropSignature = await connection.requestAirdrop(
					pubKey,
					2 * LAMPORTS_PER_SOL
				);
				const latestBlockHash = await connection.getLatestBlockhash();
				await connection.confirmTransaction({
					blockhash: latestBlockHash.blockhash,
					lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
					signature: airdropSignature,
				});
				bal = (await connection.getBalance(pubKey)) / LAMPORTS_PER_SOL;
				console.log(
					"Balance of " + pubKey.toString() + " is " + bal.toString() + " SOL"
				);
			}
		} catch (err) {
			console.error(err);
		}
		setStep(2);
		setLoader(false);
	};

	const stepTwo = async () => {
		setLoader(true);
		const { phantom } = window;
		var provider;
		if (provider == undefined) {
			provider = getProvider();
			setProvider(provider);
		}
		if (provider?.isPhantom) {
			try {
				const response = await phantom?.solana.connect();
				console.log("wallet account ", response.publicKey.toString());
				setWalletKey(response);
				setStep(3);
				setLoader(false);
			} catch (err) {
				setLoader(false);
				// { code: 4001, message: 'User rejected the request.' }
			}
		}
	};

	const stepThree = async () => {
		try {
			setLoader(true);
			console.log(
				"Sending 1.95 SOL from " +
					wallet.publicKey.toString() +
					" to " +
					walletKey.publicKey.toString()
			);
			const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
			var transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: wallet.publicKey,
					toPubkey: walletKey.publicKey,
					lamports: 1.95 * LAMPORTS_PER_SOL,
				})
			);
			var signature = await sendAndConfirmTransaction(connection, transaction, [
				wallet,
			]);
			console.log("Signature of Transaction: ", signature);
			setStep(4);
			setLoader(false);
		} catch (err) {
			console.log(err);
			setLoader(false);
		}
	};

	useEffect(() => {
		if (step == 2 || step == 3 || step == 4) {
			getBalance(new PublicKey(wallet.publicKey)).then((bal) => {
				setBalanceNew(bal);
			});
		}
		if (step == 3 || step == 4) {
			getBalance(new PublicKey(walletKey.publicKey)).then((bal) => {
				setBalancePhantom(bal);
			});
		}
	}, [step]);

	useEffect(() => {
		const provider = getProvider();
		if (provider) setProvider(provider);
		else setProvider(undefined);
	}, []);

	return (
		<>
			<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
				<a href="/">Project for SOLPROOF Module 2</a>
			</h1>
			{step == 1 && (
				<>
					<button
						className="flex bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full text-xl font-bold text-center justify-center w-5/12 mx-auto mt-20"
						onClick={stepOne}
					>
						{loader ? (
							<svg
								className="animate-spin m-1 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75 text-gray-700"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
							<span>Create a new Solana account</span>
						)}
					</button>
				</>
			)}
			{step == 2 && provider && !walletKey && (
				<>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Public Key of new wallet : {wallet?.publicKey.toString()}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Balance of new wallet : {balanceNew} SOL
					</h1>
					<button
						className="flex bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full text-xl font-bold text-center justify-center w-5/12 mx-auto mt-20"
						onClick={stepTwo}
					>
						{loader ? (
							<svg
								className="animate-spin m-1 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75 text-gray-700"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
							<span>Connect to Phantom Wallet</span>
						)}
					</button>
				</>
			)}
			{step == 2 && !provider && (
				<h1 className="text-blue-700 text-4xl font-bold text-center mt-20">
					No provider found. Install{" "}
					<a href="https://phantom.app/" className="text-red-700">
						Phantom Browser extension
					</a>
				</h1>
			)}
			{step == 3 && (
				<>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Public Key of new wallet : {wallet?.publicKey.toString()}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Balance of new wallet : {balanceNew} SOL
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Public Key of Phantom wallet : {walletKey?.publicKey.toString()}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Balance of Phantom wallet : {balancePhantom} SOL
					</h1>
					<button
						className="flex bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full text-xl font-bold text-center justify-center w-5/12 mx-auto mt-20"
						onClick={stepThree}
					>
						{loader ? (
							<svg
								className="animate-spin m-1 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75 text-gray-700"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
							<span>Transfer to new wallet</span>
						)}
					</button>
				</>
			)}
			{step == 4 && (
				<>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Public Key of new wallet : {wallet?.publicKey.toString()}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Balance of new wallet : {balanceNew}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Public Key of Phantom wallet : {walletKey?.publicKey.toString()}
					</h1>
					<h1 className="text-blue-700 text-5xl font-bold text-center mt-20">
						Balance of Phantom wallet : {balancePhantom}
					</h1>
				</>
			)}
		</>
	);
}
