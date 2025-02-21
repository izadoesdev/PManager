# PManager - Modern Project Management

PManager is a modern, intuitive project management tool built with Next.js 14, featuring a beautiful dark mode interface and powerful features for organizing tasks and collaborating with your team.

## Features

- 📋 **Kanban Board Interface**: Drag-and-drop interface for managing tasks and projects
- 🎨 **Modern UI**: Beautiful dark mode interface built with shadcn/ui components
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🏷️ **Labels & Priority**: Organize tasks with custom labels and priority levels
- ⏰ **Due Dates & Estimates**: Track deadlines and estimated completion times
- 📝 **Rich Task Details**: Add descriptions, comments, and attachments to tasks
- 🔄 **Templates**: Save and reuse board layouts for consistent project management
- 🗑️ **Archive & Trash**: Safely archive or delete items with easy restoration
- 🔍 **Search & Filter**: Quickly find tasks and filter by various criteria
- 🚀 **Performance**: Built with Next.js for optimal performance and SEO

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Database**: [Prisma](https://www.prisma.io/) with SQLite
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **Date Handling**: [Day.js](https://day.js.org/)
- **Icons**: [Lucide Icons](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ and bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/izadoesdev/pmanager.git
   cd pmanager
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up the database:
   ```bash
   bunx prisma generate
   bunx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:1000](http://localhost:1000) in your browser.

## Project Structure

```
taskflow/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── board/            # Board pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   └── ...
├── prisma/               # Prisma schema and migrations
├── public/              # Static assets
└── ...
```

## Features in Detail

### Boards
- Create and manage multiple project boards
- Customize board layouts and columns
- Save boards as templates for reuse

### Lists
- Create flexible lists for task organization
- Drag and drop to reorder lists
- Archive or delete lists as needed

### Cards
- Create detailed task cards
- Add descriptions, due dates, and time estimates
- Set priority levels and labels
- Track task status and history

### Templates
- Save board layouts as templates
- Create new boards from templates
- Manage and organize templates

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Vercel](https://vercel.com) for the amazing Next.js framework
- All our contributors and users

---

Built with ❤️ by me:)
