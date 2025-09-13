package org.exstagium.hasheger.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.Navigation
import org.exstagium.hasheger.screens.SplashScreen

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Register : Screen("register")
    object Dashboard : Screen("dashboard")
    object BiometricScreen: Screen("biometric")
    object PasswordDetail : Screen("password_detail/{id}") {
        fun createRoute(id: String) = "password_detail/$id"
    }
    object AddEditPassword : Screen("add_edit_password")
    object Settings : Screen("settings")
    object PasswordGenerator : Screen("password_generator")
    object MasterKeySetup : Screen("master_key_setup")
    object MasterKeyValidation : Screen("master_key_validation")
    object MasterKeyInfoScreen : Screen("master_key_info_screen")
    object MasterKeyNotSet : Screen("master_key_not_set")
    object TotpList : Screen("totp_list")
    object AddTotpOptions : Screen("add_totp_options")
    object ManualTotpEntry : Screen("manual_totp_entry")
}

@Composable
fun Navigation(modifier: Modifier = Modifier) {
}