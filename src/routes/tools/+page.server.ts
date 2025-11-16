import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		tools: [
			{
				id: 'backup',
				title: 'Database Backup',
				description: 'Create and manage database backups. Restore from previous backups if needed.',
				icon: 'backup',
				href: '/backup',
				color: 'blue'
			},
			{
				id: 'revenue',
				title: 'Revenue Reports',
				description:
					'View detailed revenue, tax calculations, and profit analysis by month and year.',
				icon: 'revenue',
				href: '/revenue',
				color: 'green'
			},
			{
				id: 'invoice',
				title: 'Invoice Generator',
				description: 'Generate professional invoices for your delivery services.',
				icon: 'invoice',
				href: '/invoice',
				color: 'purple'
			},
			{
				id: 'odometer',
				title: 'Odometer Tracking',
				description: 'Track vehicle odometer readings and analyze distance traveled over time.',
				icon: 'odometer',
				href: '/odometer',
				color: 'orange'
			}
		]
	};
};
