import { WalletInfo } from '@/components/wallet-info';
import { SimpleNotifications } from '@/components/simple-notifications';
import { PushNotifications } from '@/components/push-notifications';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
	return (
		<div className='font-sans min-h-screen w-full overflow-x-hidden'>
			<div className='container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-4xl'>
				<div className='flex justify-end mb-4'>
					<ThemeToggle />
				</div>
				<main className='flex flex-col gap-6 sm:gap-8 w-full relative z-10'>
					<div className='w-full'>
						<WalletInfo />
					</div>
					<div className='w-full'>
						<PushNotifications />
					</div>
					<div className='w-full'>
						<SimpleNotifications />
					</div>
				</main>
			</div>
		</div>
	);
}
