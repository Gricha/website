import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
  content: string;
  external?: string;
}

const postsDirectory = path.join(process.cwd(), 'posts');

export async function getAllPosts(): Promise<BlogPost[]> {
  // Get markdown files
  const fileNames = fs.readdirSync(postsDirectory);
  const markdownPosts = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        author: data.author,
        excerpt: data.excerpt,
        content, // Keep as raw markdown
      };
    });

  // External posts (hardcoded for now)
  const externalPosts: BlogPost[] = [
    {
      slug: '',
      external: 'https://engineering.fb.com/2016/04/13/ios/automatic-memory-leak-detection-on-ios/',
      date: 'April 13, 2016',
      title: 'Automatic memory leak detection on iOS',
      excerpt: 'How Facebook built tools to automatically detect memory leaks in their iOS app.',
      content: ''
    },
    {
      slug: '',
      external: 'https://engineering.fb.com/2015/08/24/ios/reducing-fooms-in-the-facebook-ios-app/',
      date: 'August 24, 2015',
      title: 'Reducing FOOMs in the Facebook iOS app',
      excerpt: 'How Facebook reduced foreground out-of-memory crashes in their iOS app.',
      content: ''
    }
  ];

  const parseDate = (date: string) => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // Combine and sort by date (most recent first)
  return [...markdownPosts, ...externalPosts].sort(
    (a, b) => parseDate(b.date) - parseDate(a.date)
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}
