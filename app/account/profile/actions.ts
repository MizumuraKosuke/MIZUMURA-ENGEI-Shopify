'use server'

import { CustomerAccount } from '../../../lib/customer-account'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  try {
    const customerAccount = new CustomerAccount()
    
    const profileData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string
    }
    
    await customerAccount.updateProfile(profileData)
    
    // Revalidate the profile page to show updated data
    revalidatePath('/account/profile')
    
    return { success: true, message: 'プロフィールを更新しました。' }
  } catch (error) {
    console.error('Profile update error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'エラーが発生しました。再度お試しください。' 
    }
  }
}