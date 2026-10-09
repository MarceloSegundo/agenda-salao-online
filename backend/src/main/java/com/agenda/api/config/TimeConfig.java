package com.agenda.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {

    /** Relógio no fuso do salão: define o que é "agora" para horários livres e agendamentos. */
    @Bean
    public Clock clock(@Value("${app.timezone}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
