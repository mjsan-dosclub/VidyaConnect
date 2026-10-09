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
      <Preview>Thank you for your feedback on {APP_NAME}</Preview>
      <Body
        style={{ backgroundColor: '#f6f4ff', fontFamily: 'Arial,sans-serif' }}
      >
        <Container
          style={{
            backgroundColor: '#fff',
            padding: 32,
            margin: '40px auto',
            borderRadius: 16,
          }}
        >
          <Text style={{ color: '#150089' }}>
            {APP_NAME} · Visitor feedback that shapes better products
          </Text>
          <Heading>Thank you, {name}.</Heading>
          <Text>
            Thank you for sharing your experience and ideas about originBI. Your feedback is saved and will help our team improve the product.
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
