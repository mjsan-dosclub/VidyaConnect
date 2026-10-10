import {
  Html, Head, Preview, Body, Container, Heading, Text, Hr, Img, Section,
} from '@react-email/components';
import { feedbackCategories } from '@/lib/feedback';

const paragraph = { fontSize: 15, lineHeight: '25px', color: '#625b80', margin: '12px 0' };
export default function ThankYou({ name, requirements }: { name: string; requirements: string[] }) {
  const logoUrl = new URL('/origin-logo.png', process.env.NEXT_PUBLIC_APP_URL || 'https://vidyaconnect-nine.vercel.app').toString();
  return (
    <Html lang="en">
      <Head />
      <Preview>Your feedback is received. Thank you for helping shape OriginBI.</Preview>
      <Body style={{ backgroundColor: '#f6f4ff', fontFamily: 'Arial, sans-serif', margin: 0, padding: '24px 12px' }}>
        <Container style={{ maxWidth: 560, backgroundColor: '#fff', padding: '28px 24px', border: '1px solid #e5e0f5', borderRadius: 20 }}>
          <Img src={logoUrl} width="200" height="57" alt="OriginBI — Beyond Intelligence" style={{ display: 'block', marginBottom: 28, maxWidth: '100%' }} />
          <Text style={{ color: '#150089', fontSize: 11, fontWeight: 700, letterSpacing: '2px', margin: '0 0 12px' }}>FEEDBACK RECEIVED</Text>
          <Heading style={{ color: '#150089', fontSize: 28, lineHeight: '36px', margin: '0 0 20px' }}>Your ideas help us build better.</Heading>
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>Thank you for taking the time to learn about OriginBI and share your feedback with us.</Text>
          <Text style={paragraph}>Understanding your institution’s challenges, the solutions you expect, and the features you would like to see helps us improve OriginBI for school and college management teams.</Text>
          {requirements.length > 0 && <Section style={{ backgroundColor: '#f6f4ff', borderRadius: 12, padding: '18px 20px', margin: '24px 0' }}>
            <Heading as="h2" style={{ color: '#150089', fontSize: 18, lineHeight: '26px', margin: '0 0 14px' }}>The feedback you shared</Heading>
            {requirements.map((item, i) => {
              const category = feedbackCategories.find(value => item.startsWith(value + ':'));
              const text = category ? item.slice(category.length + 1).trim() : item;
              return <Section key={i} style={{ margin: '12px 0', paddingLeft: 12, borderLeft: '3px solid #1ed36a' }}>
                {category && <Text style={{ color: '#150089', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>{category}</Text>}
                <Text style={{ ...paragraph, margin: 0 }}>{text}</Text>
              </Section>;
            })}
          </Section>}
          <Heading as="h2" style={{ color: '#150089', fontSize: 18, margin: '24px 0 8px' }}>What happens next?</Heading>
          <Text style={paragraph}>Our team will review your suggestions and use them to guide product improvements and future features.</Text>
          <Text style={paragraph}>Thank you for helping us shape a more useful OriginBI.</Text>
          <Hr style={{ borderColor: '#e5e0f5', margin: '24px 0' }} />
          <Text style={{ ...paragraph, margin: 0, color: '#150089', fontWeight: 700 }}>The OriginBI Mindworks team</Text>
          <Text style={{ ...paragraph, fontSize: 12, lineHeight: '20px', margin: '8px 0 0' }}>This email confirms that your feedback has been received.</Text>
        </Container>
      </Body>
    </Html>
  );
}
