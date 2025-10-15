'use client';

import { useAccount, useEnsName, useBalance } from 'wagmi';
import { WalletConnection } from './wallet-connection';

export function WalletInfo() {
	const { address, isConnected, chain } = useAccount();
	const { data: ensName } = useEnsName({ address });
	const { data: balance } = useBalance({ address });

	if (!isConnected) {
		return (
			<div className='flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-2xl shadow-lg w-full'>
				<div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center'>
					<svg
						className='w-6 h-6 sm:w-8 sm:h-8 text-white'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
						/>
					</svg>
				</div>
				<div className='text-center'>
					<h2 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2'>
						Connect Your Wallet
					</h2>
					<p className='text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-2'>
						Connect your wallet to access the decentralized web
					</p>
				</div>
				<WalletConnection />
			</div>
		);
	}

	return (
		<div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 w-full'>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6'>
				<div className='flex items-center gap-3'>
					<div className='w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center'>
						<svg
							className='w-4 h-4 sm:w-5 sm:h-5 text-white'
							fill='currentColor'
							viewBox='0 0 20 20'
						>
							<path
								fillRule='evenodd'
								d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
								clipRule='evenodd'
							/>
						</svg>
					</div>
					<div>
						<h2 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white'>
							Wallet Connected
						</h2>
						<p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
							Successfully connected
						</p>
					</div>
				</div>
				<div className='flex-shrink-0'>
					<WalletConnection />
				</div>
			</div>

			<div className='space-y-4'>
				<div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4'>
					<label className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block'>
						Wallet Address
					</label>
					<p className='font-mono text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-all bg-white dark:bg-gray-700 p-2 rounded border overflow-hidden'>
						{address}
					</p>
				</div>

				{ensName && (
					<div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4'>
						<label className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block'>
							ENS Name
						</label>
						<p className='text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 break-all'>
							{ensName}
						</p>
					</div>
				)}

				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
					{balance && (
						<div className='bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 sm:p-4 border border-emerald-200 dark:border-emerald-800'>
							<label className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1 block'>
								Balance
							</label>
							<p className='text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-100'>
								{parseFloat(balance.formatted).toFixed(4)}
							</p>
							<p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
								{balance.symbol}
							</p>
						</div>
					)}

					{chain && (
						<div className='bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800'>
							<label className='text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1 block'>
								Network
							</label>
							<p className='text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100 break-words'>
								{chain.name}
							</p>
							<div className='flex items-center gap-1 mt-1'>
								<div className='w-2 h-2 bg-green-500 rounded-full'></div>
								<span className='text-xs text-purple-600 dark:text-purple-400'>
									Connected
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
