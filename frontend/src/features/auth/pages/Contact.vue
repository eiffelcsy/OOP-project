<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'
import { Textarea } from '@/components/ui/textarea'

const fullName = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Simulate a short submission delay
    await new Promise((resolve) => setTimeout(resolve, 900))

    toast.info('Demo Contact Form', {
      description: 'This form is for display purposes only. No data was sent.'
    })

    fullName.value = ''
    email.value = ''
    subject.value = ''
    message.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <div class="flex flex-col gap-6">
      <Card class="self-start">
        <CardHeader>
          <CardTitle class="text-lg">Clinic Support</CardTitle>
          <CardDescription>
            Reach out for partnership inquiries, onboarding requests, or general support questions.
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="flex items-start gap-3">
            <Icon icon="mdi:email-outline" class="text-primary" width="22" height="22" />
            <div>
              <p class="text-sm font-medium">Email</p>
              <p class="text-sm text-muted-foreground">support@clinic-demo.com</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Icon icon="mdi:phone-outline" class="text-primary" width="22" height="22" />
            <div>
              <p class="text-sm font-medium">Phone</p>
              <p class="text-sm text-muted-foreground">+65 6123 4567</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Icon icon="mdi:clock-outline" class="text-primary" width="22" height="22" />
            <div>
              <p class="text-sm font-medium">Support Hours</p>
              <p class="text-sm text-muted-foreground">Monday – Friday, 9:00 AM – 6:00 PM (SGT)</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p class="text-xs text-muted-foreground">
            Looking to register as staff or admin? Fill out the form and we’ll follow up with the next steps.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Send Us a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="handleSubmit">
            <div class="grid gap-2">
              <Label for="fullName">Full Name</Label>
              <Input
                id="fullName"
                v-model="fullName"
                type="text"
                placeholder="Alex Tan"
                autocomplete="name"
                :disabled="isSubmitting"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="alex.tan@example.com"
                autocomplete="email"
                :disabled="isSubmitting"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="subject">Subject</Label>
              <Input
                id="subject"
                v-model="subject"
                type="text"
                placeholder="How can we help?"
                autocomplete="off"
                :disabled="isSubmitting"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="message">Message</Label>
              <Textarea
                id="message"
                v-model="message"
                placeholder="Share a few details about your request."
                :disabled="isSubmitting"
                required
                class="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" class="w-full" :disabled="isSubmitting">
              <Icon
                v-if="isSubmitting"
                icon="svg-spinners:180-ring"
                class="mr-2"
                width="18"
                height="18"
              />
              {{ isSubmitting ? 'Sending...' : 'Submit Message' }}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

