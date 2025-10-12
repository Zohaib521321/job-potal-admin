# Job Portal - Admin Panel

A comprehensive admin dashboard for managing the Job Portal platform, built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview with key metrics and recent activities
- **Jobs Management**: Create, edit, and manage job listings
- **Categories Management**: Organize and maintain job categories
- **Feedback & Suggestions**: Review user feedback and category suggestions
- **Contact Submissions**: View and manage contact form submissions
- **Analytics**: Track platform performance and insights
- **Dark Theme**: Professional dark interface with yellow accents

## Color Scheme

- **Primary**: `#FCD535` (Binance Yellow)
- **Primary Dark**: `#CBAF27`
- **Background**: `#0B0E11`
- **Surface**: `#181A20`
- **Text Primary**: `#EAECEF`
- **Text Secondary**: `#A1A5B0`
- **Success**: `#28C76F`
- **Error**: `#EA5455`

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the project directory:
```bash
cd job-portal-admin
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
job-portal-admin/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── jobs/              # Jobs management
│   │   ├── categories/        # Categories management
│   │   ├── applications/      # Applications management
│   │   ├── analytics/         # Analytics and reports
│   │   ├── settings/          # Platform settings
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   └── components/
│       ├── Sidebar.tsx        # Navigation sidebar
│       └── StatCard.tsx       # Statistics card component
```

## Key Pages

### Dashboard (`/`)
- Overview statistics
- Recent jobs and applications
- Quick actions

### Jobs Management (`/jobs`)
- View all job listings
- Filter by status (active, pending, closed)
- Search functionality
- Edit and delete jobs
- View applications per job

### Categories Management (`/categories`)
- Manage job categories
- View job count per category
- Add and edit categories

### Analytics (`/analytics`)
- Performance metrics and statistics
- Platform activity overview
- Trend analysis
- Export reports

### Settings (`/settings`)
- Platform configuration
- General settings
- Toggle features
- System preferences

## Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter (Google Fonts)
- **Icons**: Heroicons (SVG)

## Admin Features

### Statistics Tracking
- Total jobs
- Active applications
- Total categories
- Active users
- Trend indicators

### Data Management
- CRUD operations for jobs
- Category management
- Application status updates
- User management

### Search & Filter
- Advanced search functionality
- Status-based filtering
- Real-time updates

## Customization

### Sidebar Navigation

Edit `src/components/Sidebar.tsx` to add or modify menu items:

```tsx
const menuItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  // Add more items
];
```

### Color Theme

Modify CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: #FCD535;
  --background: #0B0E11;
  /* ... other colors */
}
```

## Security Considerations

⚠️ **Important**: This is a frontend-only implementation. In production:

- Implement authentication and authorization
- Add role-based access control
- Secure API endpoints
- Validate all inputs
- Implement CSRF protection
- Use HTTPS in production

## Future Enhancements

- Real-time notifications
- Export data to CSV/PDF
- Advanced analytics and charts
- Email templates management
- Bulk operations
- Activity logs
- Integration with backend API

## Development Notes

Currently using mock data. Replace with actual API calls when backend is ready:

```tsx
// Example API integration
const jobs = await fetch('/api/jobs').then(res => res.json());
```

## License

MIT

## Support

For support, email admin@jobportal.com
