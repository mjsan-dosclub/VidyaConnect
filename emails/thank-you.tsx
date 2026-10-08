import { APP_NAME } from '@/lib/brand';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components';
export default function ThankYou({
  name,
  requirements,
}: {
  name: string;
  requirements: string[];
}) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for connecting with {APP_NAME}</Preview>
      <Body
        style={{ backgroundColor: '#f4f6f8', fontFamily: 'Arial,sans-serif' }}
      >
        <Container
          style={{
            backgroundColor: '#fff',
            padding: 32,
            margin: '40px auto',
            borderRadius: 16,
          }}
        >
          <Text style={{ color: '#657727' }}>
            {APP_NAME} · Conversations that move education forward
          </Text>
          <Heading>Thank you, {name}.</Heading>
          <Text>
            It was a pleasure connecting at the summit. We have received your
            details and our team will follow up.
          </Text>
          {requirements.map((r, i) => (
            <Text key={i}>• {r}</Text>
          ))}
          <Hr />
          <Text>Your {APP_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
}
