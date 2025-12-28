import { Redirect } from 'expo-router';

// This tab index redirects to closet - the closet is the main home screen
export default function TabIndex() {
  return <Redirect href="/closet" />;
}
