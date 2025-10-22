# 🧪 Testing Guide - Car Market Platform

## 🚀 Quick Setup

```bash
# 1. Start services
npm run db:up
npm run dev

# 2. Access the app
Frontend: http://localhost:5173
Backend: http://localhost:3000/api
```

## 📋 Test Scenarios

### 1. **Admin Setup & Data Seeding**

**Setup Admin User:**

```sql
-- Connect to database and set a user as admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

**Seed Initial Data:**

1. Register a user account
2. Set user role to 'admin' in database
3. Login and go to `/admin/dashboard`
4. Click **"Seed Initial Data"** button
5. ✅ Should see success message: "🌱 Initial car data has been seeded successfully!"

### 2. **Car Listing Creation**

**Create a New Listing:**

1. Go to `/sell-car`
2. Fill out the form:
   - **Title**: "2020 Toyota Camry LE - Excellent Condition"
   - **Description**: "Well-maintained sedan with low mileage..."
   - **Price**: 25000
   - **Location**: "New York, NY"
   - **Make**: Select from dropdown (e.g., Toyota)
   - **Model**: "Camry"
   - **Year**: 2020
   - **Color**: Select from dropdown (e.g., White)
   - **All other fields**: Fill appropriately

3. **Upload Images**: Add 2-3 car photos
4. **Select Features**: Check relevant features
5. **Submit**: Click "Create Listing"
6. ✅ Should see: "🎉 Your car listing has been created successfully! Our team will review it within 24 hours."

### 3. **Admin Listing Approval**

**Approve the Listing:**

1. Go to `/admin/dashboard`
2. Click **"Pending Listings"** tab
3. You should see the listing you just created
4. Click **"Approve"** button
5. ✅ Should see: "✅ Listing has been approved and is now visible to users!"

### 4. **Homepage Visibility**

**Check Homepage:**

1. Go to homepage (`/`)
2. ✅ Your approved listing should now be visible
3. ✅ Search bar text should be **black and readable**
4. ✅ Listing should display with proper image and details

### 5. **Search & Filter Functionality**

**Test Search:**

1. Type "Toyota" in search bar
2. Click **"Search"** button
3. ✅ Should filter to show only Toyota listings

**Test Advanced Filters:**

1. Click **"Filters"** button
2. Set filters:
   - **Make**: Toyota
   - **Price Range**: 20000 - 30000
   - **Year Range**: 2018 - 2022
   - **Fuel Type**: Petrol
   - **Body Type**: Sedan
   - **Max Mileage**: 60000
   - **Location**: "New York"
3. Click **"Apply Filters"**
4. ✅ Should show filtered results
5. ✅ Filter count should show in button: "Apply Filters (7 active)"

**Test Clear Filters:**

1. Click **"Clear All"** button
2. ✅ Should reset all filters and show all listings

### 6. **Admin Metadata Management**

**Manage Car Makes:**

1. Go to `/admin/dashboard`
2. Click **"Car Makes"** tab
3. Click **"Add New Make"**
4. Add: Name: "tesla", Display Name: "Tesla"
5. ✅ Should see: "🚗 Car make 'Tesla' has been added successfully!"

**Manage Metadata:**

1. Click **"Metadata"** tab
2. See all metadata grouped by type
3. Click **edit** on any item
4. Update display name
5. ✅ Should update successfully

### 7. **Profile & Listing Management**

**View User Listings:**

1. Go to `/profile`
2. Scroll to **"My Listings"** section
3. ✅ Should see your created listings
4. ✅ Edit/Delete buttons should work

**Test Listing Actions:**

1. Click **"Delete"** on a listing
2. ✅ Should see: "🗑️ Your listing has been deleted successfully!"

## 🔍 **API Testing**

**Check Listings API:**

```bash
# Should now return data (not empty)
curl http://localhost:3000/api/listings

# Check metadata
curl http://localhost:3000/api/metadata/all

# Check pending listings (requires admin token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/listings/pending
```

## ✅ **Verification Checklist**

**Homepage:**

- [ ] Search bar text is black and visible
- [ ] Created listings appear after admin approval
- [ ] Filter panel opens with comprehensive options
- [ ] Search functionality works
- [ ] Filter by price range works
- [ ] Filter by year range works
- [ ] Filter by make/model works
- [ ] Clear filters resets everything

**Car Listing:**

- [ ] All dropdowns populate from database
- [ ] Color is a select dropdown (not input)
- [ ] Image upload works without errors
- [ ] Form validation shows helpful messages
- [ ] Success notifications are user-friendly

**Admin Dashboard:**

- [ ] Pending listings show after creation
- [ ] Approve/reject buttons work
- [ ] Metadata management works
- [ ] Car makes can be added/edited
- [ ] All notifications are descriptive

**Profile:**

- [ ] User listings show correctly
- [ ] Edit/delete actions work
- [ ] Avatar upload works
- [ ] Profile updates work

## 🚨 **Troubleshooting**

**If listings don't appear:**

1. Check if listing was created successfully
2. Verify admin approval in dashboard
3. Check database for listing status

**If search bar text is invisible:**

- Fixed with `text-gray-900 bg-white` classes

**If filters don't work:**

1. Check browser console for errors
2. Verify metadata is loaded
3. Check API responses

**If admin can't approve listings:**

1. Verify user role is 'admin' in database
2. Check authentication token
3. Verify admin endpoints are accessible

## 🎯 **Expected Results**

After following this guide:

- ✅ **Listings visible** on homepage after approval
- ✅ **Search functionality** working with readable text
- ✅ **Comprehensive filters** with 8+ filter options
- ✅ **Admin workflow** for listing approval
- ✅ **User-friendly notifications** throughout
- ✅ **Database-driven metadata** for all form options

Your Car Market platform should now be fully functional! 🚗✨
