import Link from 'next/link';
export default function EmptyState({title='Nothing here yet',description='When you add something, it will show up here.',action,href}){return <div className="empty-state"><span className="empty-icon">✳</span><h3>{title}</h3><p>{description}</p>{action&&href&&<Link className="button button-primary" href={href}>{action}</Link>}</div>;}
