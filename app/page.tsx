import { WalletInfo } from '@/components/wallet-info';
import { SimpleNotifications } from '@/components/simple-notifications';
import { PushNotifications } from '@/components/push-notifications';

export default function Home() {
	return (
		<div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
			<main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-w-2xl w-full'>
				<WalletInfo />
				<PushNotifications />
				<SimpleNotifications />
			</main>
		</div>
	);
}
