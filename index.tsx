import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { signIn, signOut, signUp } from '../services/auth.service';
import { getProfile } from '../services/profile.service';
import { createServiceRequest, getRecentRequests } from '../services/requests.service';
import { colors } from '../constants/colors';
import type { Profile, ServiceRequest, ServiceType, UserRole, AppTab } from '../types/app';
import { styles } from './index.styles';

const roles: UserRole[] = ['customer', 'driver', 'restaurant'];
const services: { value: ServiceType; label: string }[] = [
  { value: 'ride', label: '🚗 Ride' },
  { value: 'food', label: '🍲 Food' },
  { value: 'parcel', label: '📦 Parcel' },
];

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [tab, setTab] = useState<AppTab>('home');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [details, setDetails] = useState('');
  const [kind, setKind] = useState<ServiceType>('ride');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadUserData(data.session.user.id);
      if (mounted) setBusy(false);
    }

    initialize();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadUserData(nextSession.user.id);
      } else {
        setProfile(null);
        setRequests([]);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadUserData(userId: string) {
    const [profileResult, requestsResult] = await Promise.all([
      getProfile(userId),
      getRecentRequests(),
    ]);

    if (profileResult.error) {
      console.warn('Profile load failed:', profileResult.error.message);
    }
    if (requestsResult.error) {
      console.warn('Requests load failed:', requestsResult.error.message);
    }

    setProfile(profileResult.data ?? null);
    setRequests(requestsResult.data ?? []);
  }

  async function handleSignIn() {
    const { error } = await signIn(email.trim(), password);
    if (error) Alert.alert('Login failed', error.message);
  }

  async function handleSignUp() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter your full name to create an account.');
      return;
    }
    const { error } = await signUp(email.trim(), password, name.trim(), role);
    if (error) Alert.alert('Registration failed', error.message);
    else Alert.alert('Check your email', 'Confirm your email to activate your account.');
  }

  async function handleCreateRequest() {
    if (!session?.user?.id) return;
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Missing details', 'Enter pickup and destination.');
      return;
    }

    setSubmitting(true);
    const { error } = await createServiceRequest({
      customerId: session.user.id,
      serviceType: kind,
      pickupAddress: pickup.trim(),
      dropoffAddress: dropoff.trim(),
      description: details.trim(),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not submit', error.message);
      return;
    }

    Alert.alert(
      'Request received',
      'Your request has been saved. A driver or restaurant can process it when dispatch is configured.',
    );
    setPickup('');
    setDropoff('');
    setDetails('');
    await loadUserData(session.user.id);
  }

  if (busy) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.auth}>
          <Text style={styles.brand}>🌿 ACACIA</Text>
          <Text style={styles.heading}>Rides & Food</Text>
          <Text style={styles.muted}>One app for rides, meals and parcels across Kenya.</Text>

          <TextInput
            style={styles.input}
            placeholder="Full name (for registration)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Create account as</Text>
          <View style={styles.row}>
            {roles.map((item) => (
              <Pressable
                key={item}
                onPress={() => setRole(item)}
                style={[styles.chip, role === item && styles.selected]}
              >
                <Text style={role === item ? styles.white : styles.text}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primary} onPress={handleSignIn}>
            <Text style={styles.white}>Sign in</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={handleSignUp}>
            <Text style={styles.green}>Create account</Text>
          </Pressable>
          <Text style={styles.tiny}>
            Admin accounts must be provisioned securely in Supabase by the project owner.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isStaff = ['driver', 'restaurant', 'admin'].includes(profile?.role ?? '');

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.top}>
        <View>
          <Text style={styles.brand}>🌿 ACACIA</Text>
          <Text style={styles.muted}>Hello, {profile?.full_name || session.user.email}</Text>
        </View>
        <Pressable onPress={() => void signOut()}>
          <Text style={styles.green}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {profile?.role === 'customer' || !profile?.role ? (
          <>
            <Text style={styles.heading}>What do you need today?</Text>
            <View style={styles.row}>
              {services.map((service) => (
                <Pressable
                  key={service.value}
                  onPress={() => setKind(service.value)}
                  style={[styles.service, kind === service.value && styles.serviceOn]}
                >
                  <Text style={styles.serviceText}>{service.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Pickup / collection address</Text>
            <TextInput
              style={styles.input}
              value={pickup}
              onChangeText={setPickup}
              placeholder="e.g. Westlands, Nairobi"
            />
            <Text style={styles.label}>{kind === 'food' ? 'Delivery address' : 'Destination address'}</Text>
            <TextInput
              style={styles.input}
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Enter destination"
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={details}
              onChangeText={setDetails}
              placeholder={
                kind === 'food'
                  ? 'Restaurant, meals and instructions'
                  : kind === 'parcel'
                    ? 'Parcel description and recipient contact'
                    : 'Ride notes or special requests'
              }
            />
            <Pressable style={styles.primary} onPress={handleCreateRequest} disabled={submitting}>
              <Text style={styles.white}>{submitting ? 'Submitting…' : `Submit ${kind} request`}</Text>
            </Pressable>
          </>
        ) : null}

        {isStaff ? (
          <>
            <Text style={styles.heading}>
              {profile?.role === 'driver'
                ? 'Driver workspace'
                : profile?.role === 'restaurant'
                  ? 'Restaurant workspace'
                  : 'Admin workspace'}
            </Text>
            <Text style={styles.muted}>
              Requests are stored in Supabase. Role-specific assignment and management policies are
              defined in the backend migration.
            </Text>
          </>
        ) : null}

        {tab === 'activity' ? <Text style={styles.heading}>Activity</Text> : null}
        {tab === 'account' ? <Text style={styles.heading}>Account</Text> : null}

        <Text style={styles.section}>Recent service requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.muted}>No requests yet.</Text>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.item}>
              <Text style={styles.itemTitle}>
                {request.service_type.toUpperCase()} · {request.status}
              </Text>
              <Text style={styles.muted}>
                {request.pickup_address || '—'} → {request.dropoff_address || '—'}
              </Text>
              <Text style={styles.tiny}>{new Date(request.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
        <Text style={styles.tiny}>
          Payments are not activated until Daraja credentials, callback URL and live payment
          verification are configured.
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        {(['home', 'activity', 'account'] as AppTab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)}>
            <Text style={[styles.nav, tab === item && styles.green]}>
              {item === 'home' ? '⌂ Home' : item === 'activity' ? '▤ Activity' : '◎ Account'}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
