import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, BackHandler, Alert, ToastAndroid, Linking, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationsContext';  // Importando o hook do contexto
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth'; // Atualizado
import Share from 'react-native-share';
import { RFValue } from "react-native-responsive-fontsize";
import DeviceInfo from 'react-native-device-info';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';



export default function HomeScreen() {
  const [name, setName] = useState('Usuário');
  const { notifications, markAsRead, loadNotifications } = useNotifications(); // Acessando notificações e função de marcação
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const router = useRouter();

  const handleShare = async () => {
    try {
      const message = `🎉 O Campus Connect é para TODOS! 📲
  
  Se você é aluno do campus, independentemente do seu curso, seja Administração, Logística, Qualidade ou qualquer outro. Sim, você pode baixar e usar o nosso app! 🚀✨
  
  🔗 Baixe o app agora mesmo: 
  https://drive.google.com/file/d/1qnnT8aKB82pP_gu0CuLFApVelYzWGzm7/view?usp=drive_link
  
  A equipe do Campus Connect agradece! 💚📚`;

      await Share.open({ message });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  // Função para verificar se há notificações não lidas
  const checkUnreadNotifications = () => {
    const unreadNotifications = notifications.some((notification) => !notification.read);
    setHasNewNotification(unreadNotifications);
  };


  const checkAppVersion = async () => {
    const currentVersion = DeviceInfo.getVersion();
    console.log('[Versão Atual]:', currentVersion);
  
    try {
      const lastCheck = await AsyncStorage.getItem('lastVersionCheck');
      const today = new Date().toISOString().slice(0, 10); // formato: "2025-04-06"
  
      // Verifica se já foi feito hoje
      if (lastCheck === today) {
        console.log('[Verificação de versão já feita hoje]');
        return;
      }
  
      const db = getFirestore();
      const docRef = doc(db, 'app_version', 'current');
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists) {
        const data = docSnap.data();
        const latestVersion = data?.latest_version;
        const updateUrl = data?.update_url;
  
        console.log('[Versão mais recente no Firestore]:', latestVersion);
        console.log('[URL de atualização]:', updateUrl);
  
        if (latestVersion && currentVersion !== latestVersion) {
          Alert.alert(
            'Atualização disponível',
            `Sua versão do app é ${currentVersion} \nA versão mais recente é ${latestVersion}.`,
            [
              {
                text: 'Atualizar agora',
                onPress: () => {
                  if (updateUrl) Linking.openURL(updateUrl);
                }
              },
              {
                text: 'Lembrar novamente amanhã',
                style: 'cancel',
                onPress: () => console.log('[Lembrar novamente amanhã]')
              }
            ]
          );
        } else {
          console.log('[App está atualizado]');
        }
  
        // Atualiza o AsyncStorage com a data de hoje
        await AsyncStorage.setItem('lastVersionCheck', today);
      } else {
        console.log('[Documento não encontrado no Firestore]');
      }
    } catch (error) {
      console.error('[Erro ao verificar versão]:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("Tela focada - Carregando nome...");

      // Carregar o nome após um tempo
      const fetchName = async () => {
        const storedName = await AsyncStorage.getItem('userName');
        console.log("Nome armazenado: ", storedName);
        if (storedName) {
          setName(storedName);
        } else {
          console.log("Nenhum nome encontrado no AsyncStorage.");
        }
      };

      fetchName();
      checkAppVersion();

      // Função para lidar com o botão de voltar
      const backAction = () => {
        Alert.alert("Sair do App", "Você realmente quer sair?", [
          { text: "Não", onPress: () => null, style: "cancel" },
          { text: "Sim", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      };

      // Adicionando o listener de back press
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => {
        console.log("Removendo listener de back press...");
        backHandler.remove(); // Remove o listener de back press
      };
    }, [])
  );


  // Carregar notificações ao focar na tela
  useFocusEffect(
    React.useCallback(() => {

      checkUnreadNotifications();

      // Simula um atraso de 3 segundos para verificar as notificações
      const notificationTimeoutId = setTimeout(() => {
        loadNotifications();
        checkUnreadNotifications();
      }, 10000); // 10000 milissegundos (10 segundos)
      return () => {
        clearTimeout(notificationTimeoutId); // Limpa o timeout de checkUnreadNotifications
      };
    }, [notifications]) // Recarregar sempre que as notificações mudarem
  );
  // Função de manipulação de notificações
  const handleNotificationClick = async () => {
    console.log("🖱️ Clicado no botão de notificação...");
    console.log("🚀 Redirecionando para tela de notificações...");
    router.push('/Screens/Notifications');
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    console.log("Hora atual: ", hours);
    if (hours < 12) {
      return "Bom dia";
    } else if (hours < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  const handleNameClick = () => {
    console.log("Clicado no nome para alteração...");
    Alert.alert(
      "Deseja alterar seu nome?",
      "",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", onPress: () => router.push("/Screens/Hello") },
      ]
    );
  };

  // Verifica se o usuário está autenticado no momento do clique
  const checkAuthentication = () => {
    const auth = getAuth(); // Uso do Firebase Auth atualizado

    const user = auth.currentUser; // Obtém o usuário autenticado
    if (user) {
      // Se o usuário estiver autenticado, redireciona para outra tela
      router.push("/Screens/Notification/UpdateNotification"); // Altere o caminho para a tela desejada
    } else {
      // Se o usuário não estiver autenticado, vai para a tela de login
      router.push("/Screens/Login");
    }
  };

  const menuItems = [
    {
      id: 1,
      label: 'Calendário Acadêmico',
      icon: 'calendar-month' as const,
      onPress: () => {
        router.push("/Screens/Calendar");
        console.log('Academic Calendar');
      }
    },
    {
      id: 2,
      label: 'Cursos',
      icon: 'notebook-edit' as const,
      onPress: () => {
        router.push("/Screens/Cursos");
        console.log('Courses');
      }
    },
    {
      id: 3,
      label: 'Horários dos Ônibus',
      icon: 'bus-clock' as const,
      onPress: () => {
        router.push("/Screens/Linha");
        console.log('Horários do Ônibus');
      }
    },
    {
      id: 4,
      label: 'Horários das Aulas',
      icon: 'clock' as const,
      onPress: () => {
        router.push("/Screens/Aulas");
        console.log('Horários das aulas');
      }
    },
    {
      id: 5,
      label: 'WhatsApp',
      icon: 'whatsapp' as const,
      onPress: () => {
        router.push("/Screens/Whats");
        console.log('WhatsApp');
      }
    },
    {
      id: 6,
      label: 'Contatos',
      icon: 'email' as const,
      onPress: () => {
        router.push("/Screens/Contato");
        console.log('Contacts');
      }
    },
    {
      id: 7,
      label: 'Acesso ao QAcadêmico',
      icon: 'web' as const,
      onPress: () => {
        Linking.openURL("https://qacademico.ifpe.edu.br/");
        console.log('QAcadêmico Access');
      }
    },
    {
      id: 8,
      label: 'Requerimentos CRADT',
      icon: 'file-document-edit' as const,
      onPress: () => {
        Linking.openURL("https://docs.google.com/forms/d/e/1FAIpQLSfny1cPy4j0pIMy1A8XL1mq9lf6ZoalVkhTpMwHdyjhQZhkAw/viewform");
        console.log('Forms');
      }
    },
    {
      id: 9,
      label: 'Bolsas e Estágios',
      icon: 'briefcase-account' as const,
      onPress: () => {
        router.push("/Screens/Bolsas");
        console.log('Scholarships');
      }
    },
    {
      id: 10,
      label: 'Núcleos de Apoio',
      icon: 'account-group' as const,
      onPress: () => {
        router.push("/Screens/Nucleos");
        console.log('Núcleos de Apoio');
      }
    },
    {
      id: 11,
      label: 'Setores',
      icon: 'office-building' as const,
      onPress: () => {
        router.push("/Screens/Setores");
        console.log('Departments');
      }
    },
    {
      id: 12,
      label: 'Serviço de Orientação Psicológica',
      icon: 'head-heart' as const,
      onPress: () => {
        console.log('Psychological Support');
        router.push("/Screens/Servico");
      }
    },
    {
      id: 13,
      label: 'Carteira de Estudante',
      icon: 'card-account-details' as const,
      onPress: () => {
        console.log('Carteira de estudante');
        router.push("/Screens/Carteira");
      }
    },
    {
      id: 14,
      label: 'Portal Campus Igarassu',
      icon: require('./Menuindex/Logoif.png'), // Caminho correto para a imagem
      onPress: () => {
        Linking.openURL("https://portal.ifpe.edu.br/igarassu/");
        console.log('Portal');
      },
    },
    {
      id: 15,
      label: 'FAQ',
      icon: 'help-circle' as const,
      onPress: () => router.push("/Screens/FAQ"),
    },
    {
      id: 16,
      label: 'Administrador',
      icon: 'account-lock' as const,
      onPress: checkAuthentication,
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header com saudação e ícone de notificações */}
      <View style={styles.header}>
        <Text style={styles.greeting} onPress={handleNameClick}>
          {getGreeting()}, {name}!
        </Text>

        <View style={styles.headerIcons}>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <MaterialCommunityIcons name="share-variant" size={28} color="black" />
          </Pressable>

          <Pressable onPress={handleNotificationClick} style={styles.notificationIcon}>
            {hasNewNotification && <View style={styles.notificationBadge} />}
            <MaterialCommunityIcons name="bell" size={28} color="black" />
          </Pressable>
        </View>
      </View>


      {/* Menu de opções */}
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        renderItem={({ item }) => (
          <Pressable style={styles.menuButton} onPress={item.onPress}>
            {typeof item.icon === 'string' ? (
              // Se for string, usa um ícone da biblioteca
              <MaterialCommunityIcons name={item.icon as any} size={66} color="white" />
            ) : (
              // Se não for string, renderiza uma imagem PNG
              <Image source={item.icon} style={{ width: 66, height: 66 }} resizeMode="contain" />
            )}
            <Text style={styles.buttonText}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    padding: 16,
    paddingTop: 62,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#000',
  },
  notificationIcon: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    backgroundColor: 'red',
    borderRadius: 6,
  },
  gridContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  menuButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#35672D',
    margin: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
  },

});
