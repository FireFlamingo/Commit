package org.exstagium.hasheger

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import org.exstagium.hasheger.navigation.Screen
import org.exstagium.hasheger.screens.AIPasswordGeneratorScreen
import org.exstagium.hasheger.screens.AddEditPasswordScreen
import org.exstagium.hasheger.screens.AddTotpOptionsScreen
import org.exstagium.hasheger.screens.AuthUiState
import org.exstagium.hasheger.screens.BiometricAuthScreen
import org.exstagium.hasheger.screens.CheckMasterKeyScreen
import org.exstagium.hasheger.screens.DashboardScreen
import org.exstagium.hasheger.screens.LoginScreen
import org.exstagium.hasheger.screens.ManualTotpEntryScreen
import org.exstagium.hasheger.screens.MasterKeyInfoScreen
import org.exstagium.hasheger.screens.MasterKeyNotSetScreen
import org.exstagium.hasheger.screens.MasterKeyScreen
import org.exstagium.hasheger.screens.PasswordDetailScreen
import org.exstagium.hasheger.screens.RegisterScreen
import org.exstagium.hasheger.screens.SettingsScreen
import org.exstagium.hasheger.screens.SplashScreen
import org.exstagium.hasheger.screens.TotpListScreen
import org.exstagium.hasheger.ui.theme.HashegerTheme
import org.exstagium.hasheger.utils.BiometricUtils
import org.exstagium.hasheger.utils.PasswordVault
import org.exstagium.hasheger.utils.User
import org.exstagium.hasheger.utils.UserStateManager
import org.exstagium.hasheger.utils.VaultResult
import javax.crypto.spec.SecretKeySpec


class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val navController = rememberNavController()
            val biometricUtils = BiometricUtils(this)
            HashegerTheme {
                AppNavHost(navController = navController, biometricUtils = biometricUtils)
            }
        }
    }
}

// 1. Auth with JWT
// 2. Biometric auth [DONE]
// 3. Need to store and encrypt passwords

@SuppressLint("RememberReturnType")
@Composable
fun AppNavHost(navController: NavHostController, biometricUtils: BiometricUtils) {
    val userKeySpec = remember { mutableStateOf<SecretKeySpec?>(null) }
    // User and vault state
    var currentUser by remember { mutableStateOf<User?>(null) }

    // Initialize user state on app start
    remember {
        currentUser = UserStateManager.getCurrentUser(navController.context)
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            userKeySpec.value = null
            SplashScreen(navController, currentUser)
        }
        composable(Screen.BiometricScreen.route) {
            BiometricAuthScreen(
                biometricUtils = biometricUtils,
                onAuthenticated = {
                    Toast.makeText(navController.context, "Authenticated", Toast.LENGTH_LONG).show()
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.BiometricScreen.route) { inclusive = true }
                    }
                    println("Yeah! We are authenticated")
                },
                onFailed = {
                    Toast.makeText(navController.context, "Authetication failed", Toast.LENGTH_LONG).show()
                    navController.popBackStack()
                }
            )
        }
        composable(Screen.Login.route) {
            var loginError by remember { mutableStateOf<String?>(null) }
            var isLoggingIn by remember { mutableStateOf(false) }

            LoginScreen(
                onLoginSuccess = { ->
                    // Check if user has vault setup
//                    if (PasswordVault.isMasterPasswordSet(navController.context)) {
//                        navController.navigate(Screen.MasterKeyValidation.route) {
//                            popUpTo(Screen.Login.route) { inclusive = true }
//                        }
//                    } else {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
//                    }
                },
                onNavigateToSignUp = {
                    navController.navigate(Screen.Register.route)
                },
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                uiState = AuthUiState(),
                onRegisterSuccess = { ->
                    navController.navigate(Screen.MasterKeyInfoScreen.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onClearError = {}
            )
        }
        composable(Screen.MasterKeyInfoScreen.route) {
            MasterKeyInfoScreen {
                navController.navigate(Screen.Dashboard.route)
            }
        }
        composable(Screen.MasterKeyNotSet.route) {
            MasterKeyNotSetScreen({
                navController.navigate(Screen.MasterKeySetup.route)
            }, {
                navController.popBackStack()
            })
        }
        composable(Screen.MasterKeySetup.route) {
            var setupError by remember { mutableStateOf<String?>(null) }
            var isSettingUp by remember { mutableStateOf(false) }

            MasterKeyScreen(
                uiState = AuthUiState(
                    error = setupError,
                    isLoading = isSettingUp
                ),
                onSetMasterKey = { masterPassword ->
                    isSettingUp = true
                    setupError = null

                    // First derive the key
                    when (val keyResult = PasswordVault.deriveKeyFromPassword(
                        masterPassword,
                        navController.context
                    )) {
                        is VaultResult.Success -> {
                            // Then create vault check
                            when (val checkResult = PasswordVault.createVaultCheck(
                                masterPassword,
                                navController.context
                            )) {
                                is VaultResult.Success -> {
                                    userKeySpec.value = keyResult.data
                                    navController.navigate(Screen.Dashboard.route) {
                                        popUpTo(Screen.MasterKeySetup.route) {
                                            inclusive = true
                                        }
                                    }
                                }

                                is VaultResult.Error -> {
                                    setupError =
                                        "Failed to setup vault: ${checkResult.message}"
                                    Log.e(
                                        "MasterKeySetup",
                                        "Failed to create vault check",
                                        checkResult.exception
                                    )
                                }
                            }
                        }

                        is VaultResult.Error -> {
                            setupError =
                                "Failed to create encryption key: ${keyResult.message}"
                            Log.e(
                                "MasterKeySetup",
                                "Failed to derive key",
                                keyResult.exception
                            )
                        }
                    }
                    isSettingUp = false
                },
                onClearError = {
                    setupError = null
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        composable(Screen.MasterKeyValidation.route) {
            CheckMasterKeyScreen(
                uiState = AuthUiState(),
                onClearError = {},
                onBack = {
                    navController.popBackStack()
                },
                onSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.MasterKeyValidation.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Dashboard.route) {
            DashboardScreen(navController, userKeySpec.value, onAddTotp = {
                navController.navigate(Screen.AddTotpOptions.route)
            })
        }
        composable(Screen.PasswordGenerator.route) {
            AIPasswordGeneratorScreen(navController)
        }
        composable(Screen.PasswordDetail.route) { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id") ?: ""
            PasswordDetailScreen(navController, id)
        }
        composable(Screen.AddEditPassword.route) {
            AddEditPasswordScreen(navController)
        }
        composable(Screen.Settings.route) {
            SettingsScreen(navController)
        }
        composable(Screen.TotpList.route) {
            TotpListScreen(
                entries = emptyList(), // replace with actual data
                onAddTotp = { navController.navigate(Screen.AddTotpOptions.route) },
                onEditEntry = { entryId -> /* navigate to edit if needed */ },
                onCopyCode = { entryId -> /* handle copy */ },
                onDeleteEntry = { entryId -> /* handle delete */ },
            )
        }

        composable(Screen.AddTotpOptions.route) {
            AddTotpOptionsScreen(
                onManualEntry = { navController.navigate(Screen.ManualTotpEntry.route) },
                onScanQrCode = { /* navigate to QR scan screen */ },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.ManualTotpEntry.route) {
            ManualTotpEntryScreen(
                onSave = { entry ->
                    // save TOTP entry
                    navController.popBackStack()
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}